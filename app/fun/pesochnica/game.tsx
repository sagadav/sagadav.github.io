'use client'
import { useEffect, useRef, useState } from 'react'
import {
  BombIcon,
  BrickWallIcon,
  EraserIcon,
  HourglassIcon,
  RotateCcwIcon,
  Trash2Icon,
  Volume2Icon,
  VolumeXIcon,
  ZapIcon,
} from 'lucide-react'

// Falling-sand toy: a grid of cells updated bottom-up every tick. Bombs are small
// solid discs stamped into the grid so sand piles on them; when the fuse runs out
// the blast clears a circle, flings loose cells as particles that settle back as
// sand, and cracks the blocks around the crater into falling rubble. Bombs caught
// in a blast go off shortly after, so they chain.

// Grid size is picked once per mount from the container (see gridSize) and set
// before a world is created; everything below reads these.
let W = 160
let H = 110
const TICK = 1000 / 60
const MAX_PARTICLES = 5000
const MAX_BOMBS = 40

const EMPTY = 0
const SAND = 1
const BLOCK = 2
const RUBBLE = 3
const BOMB = 4
const FIRE = 5

type Tool = 'bomb' | 'mega' | 'sand' | 'block' | 'erase'

type Bomb = { x: number; y: number; r: number; blast: number; fuse: number; alive: boolean }
type Particle = { x: number; y: number; vx: number; vy: number; type: number; shade: number; ghost: number }

const BOMBS = {
  bomb: { r: 2, blast: 13, fuse: 90 },
  mega: { r: 3, blast: 26, fuse: 120 },
}

const BRUSH = { sand: 3, block: 3, erase: 5 }

function createWorld() {
  return {
    cells: new Uint8Array(W * H),
    shade: new Uint8Array(W * H),
    life: new Uint8Array(W * H),
    bombs: [] as Bomb[],
    particles: [] as Particle[],
    frame: 0,
    shake: 0,
  }
}

type World = ReturnType<typeof createWorld>

const disks = new Map<number, [number, number][]>()

function disk(r: number) {
  let offsets = disks.get(r)
  if (!offsets) {
    offsets = []
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r + r) offsets.push([dx, dy])
      }
    }
    disks.set(r, offsets)
  }
  return offsets
}

const inside = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H
const free = (t: number) => t === EMPTY || t === FIRE

function put(w: World, i: number, type: number) {
  w.cells[i] = type
  w.shade[i] = (Math.random() * 4) | 0
}

function move(w: World, from: number, to: number) {
  w.cells[to] = w.cells[from]
  w.shade[to] = w.shade[from]
  w.cells[from] = EMPTY
}

function buildScene(w: World) {
  w.cells.fill(EMPTY)
  w.bombs = []
  w.particles = []

  // the layout is drawn for 160×110 and stretched to whatever grid we got
  const sx = W / 160
  const sy = H / 110

  for (let x = 0; x < W; x++) {
    const top = H - Math.round(18 * sy) - Math.round(Math.sin(x * 0.045) * 4 + Math.sin(x * 0.11 + 1) * 2)
    for (let y = top; y < H; y++) put(w, y * W + x, SAND)
  }

  // [left, width, height]
  const towers = [
    [8, 18, 52],
    [40, 14, 36],
    [70, 26, 72],
    [108, 16, 44],
    [132, 22, 60],
  ].map(([left, width, height]) => [Math.round(left * sx), Math.round(width * sx), Math.round(height * sy)])
  for (const [left, width, height] of towers) {
    const roof = H - height
    for (let y = roof; y < H; y++) {
      for (let x = left; x < left + width; x++) {
        const wx = x - left
        const wy = y - roof
        const hole = wx >= 2 && wx < width - 2 && wx % 4 >= 2 && wy > 2 && wy % 5 >= 2 && wy % 5 <= 3
        if (hole) w.cells[y * W + x] = EMPTY
        else put(w, y * W + x, BLOCK)
      }
    }
    for (let k = 0; k < width / 2; k++) {
      for (let x = left + k; x < left + width - k; x++) put(w, (roof - 1 - k) * W + x, SAND)
    }
  }

  // a bridge between the second and third towers with a sand heap on it
  const [left, width, height] = towers[1]
  const deck = H - height + 2
  for (let x = left + width; x < towers[2][0]; x++) {
    put(w, deck * W + x, BLOCK)
    put(w, (deck + 1) * W + x, BLOCK)
    for (let y = deck - 4; y < deck; y++) {
      if (Math.random() < 0.7) put(w, y * W + x, SAND)
    }
  }
}

// Phones get fewer, bigger cells and a portrait field sized to leave room for
// the toolbars on screen.
function gridSize(el: HTMLElement) {
  const width = el.clientWidth
  if (width >= 520) return { w: 160, h: 110 }
  const w = 100
  const h = Math.round((w * window.innerHeight * 0.6) / width)
  return { w, h: Math.min(Math.max(h, 80), 150) }
}

function stamp(w: World, b: Bomb, type: number) {
  for (const [dx, dy] of disk(b.r)) w.cells[(b.y + dy) * W + b.x + dx] = type
}

function fits(w: World, x: number, y: number, r: number) {
  for (const [dx, dy] of disk(r)) {
    if (!inside(x + dx, y + dy) || !free(w.cells[(y + dy) * W + x + dx])) return false
  }
  return true
}

function placeBomb(w: World, cx: number, cy: number, kind: 'bomb' | 'mega') {
  if (w.bombs.length >= MAX_BOMBS) return
  const { r, blast, fuse } = BOMBS[kind]
  const x = Math.min(Math.max(cx, r), W - 1 - r)
  const y = Math.min(Math.max(cy, r), H - 1 - r)
  if (disk(r).some(([dx, dy]) => w.cells[(y + dy) * W + x + dx] === BOMB)) return
  const bomb = { x, y, r, blast, fuse, alive: true }
  stamp(w, bomb, BOMB)
  w.bombs.push(bomb)
}

function paint(w: World, cx: number, cy: number, tool: 'sand' | 'block' | 'erase') {
  for (const [dx, dy] of disk(BRUSH[tool])) {
    const x = cx + dx
    const y = cy + dy
    if (!inside(x, y)) continue
    const i = y * W + x
    if (tool === 'erase') {
      if (w.cells[i] !== BOMB) w.cells[i] = EMPTY
    } else if (free(w.cells[i]) && (tool === 'block' || Math.random() < 0.4)) {
      put(w, i, tool === 'sand' ? SAND : BLOCK)
    }
  }
}

function explode(w: World, b: Bomb, onBoom: (size: number) => void) {
  b.alive = false
  stamp(w, b, EMPTY)
  const R = b.blast
  const { cells, shade, life } = w
  for (const [dx, dy] of disk(R)) {
    const x = b.x + dx
    const y = b.y + dy
    if (!inside(x, y)) continue
    const i = y * W + x
    const t = cells[i]
    if (t === BOMB) continue
    const d = Math.sqrt(dx * dx + dy * dy) / R
    if (t === BLOCK && d > 0.75) {
      if (Math.random() < 0.6) cells[i] = RUBBLE
      continue
    }
    if (!free(t) && w.particles.length < MAX_PARTICLES && Math.random() < 0.6) {
      const angle = Math.atan2(dy, dx)
      const speed = (1 - d) * 3.5 + Math.random()
      w.particles.push({
        x: x + 0.5,
        y: y + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        type: t === BLOCK ? RUBBLE : t,
        shade: shade[i],
        ghost: 3,
      })
    }
    if (Math.random() < 0.9 - d * 0.6) {
      cells[i] = FIRE
      life[i] = 2 + ((Math.random() * 16 * (1 - d)) | 0)
    } else {
      cells[i] = EMPTY
    }
  }
  for (const other of w.bombs) {
    if (other.alive && Math.hypot(other.x - b.x, other.y - b.y) < R + other.r) {
      other.fuse = Math.min(other.fuse, 3 + ((Math.random() * 8) | 0))
    }
  }
  w.shake = Math.min(12, w.shake + R * 0.4)
  onBoom(R)
}

function settle(w: World, p: Particle) {
  const x = Math.min(Math.max(p.x | 0, 0), W - 1)
  let y = Math.min(Math.floor(p.y), H - 1)
  while (y >= 0 && !free(w.cells[y * W + x])) y--
  if (y < 0) return
  w.cells[y * W + x] = p.type
  w.shade[y * W + x] = p.shade
}

function step(w: World, onBoom: (size: number) => void) {
  w.frame++
  const { cells, life } = w

  for (let i = 0; i < W * H; i++) {
    if (cells[i] === FIRE && --life[i] === 0) cells[i] = EMPTY
  }

  // bottom-up, so a falling cell lands in a row that is already done this tick;
  // the scan direction alternates to keep piles from leaning one way
  const flip = w.frame & 1
  for (let y = H - 2; y >= 0; y--) {
    for (let k = 0; k < W; k++) {
      const x = flip ? k : W - 1 - k
      const i = y * W + x
      const t = cells[i]
      if (t !== SAND && t !== RUBBLE) continue
      const below = i + W
      if (free(cells[below])) {
        move(w, i, below)
        continue
      }
      // rubble is chunkier and holds steeper slopes
      if (t === RUBBLE && Math.random() < 0.5) continue
      const s = Math.random() < 0.5 ? -1 : 1
      if (x + s >= 0 && x + s < W && free(cells[below + s])) move(w, i, below + s)
      else if (x - s >= 0 && x - s < W && free(cells[below - s])) move(w, i, below - s)
    }
  }

  for (const b of w.bombs) {
    if (!b.alive) continue
    if (--b.fuse <= 0) {
      explode(w, b, onBoom)
      continue
    }
    stamp(w, b, EMPTY)
    for (let n = 0; n < 2 && fits(w, b.x, b.y + 1, b.r); n++) b.y++
    stamp(w, b, BOMB)
  }
  w.bombs = w.bombs.filter((b) => b.alive)

  const ps = w.particles
  for (let n = ps.length - 1; n >= 0; n--) {
    const p = ps[n]
    p.vy += 0.16
    if (p.ghost > 0) p.ghost--
    const steps = Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy), 1))
    let landed = false
    for (let s = 0; s < steps; s++) {
      let nx = p.x + p.vx / steps
      const ny = p.y + p.vy / steps
      if (nx < 0 || nx >= W) {
        p.vx = -p.vx * 0.4
        nx = p.x
      }
      const iy = Math.floor(ny)
      if (iy >= H || (iy >= 0 && p.ghost === 0 && !free(cells[iy * W + (nx | 0)]))) {
        settle(w, p)
        landed = true
        break
      }
      p.x = nx
      p.y = ny
    }
    if (landed) {
      ps[n] = ps[ps.length - 1]
      ps.pop()
    }
  }

  w.shake *= 0.88
}

// little-endian ABGR, which is what a Uint32Array over ImageData sees
const rgb = (r: number, g: number, b: number) => 0xff000000 | (b << 16) | (g << 8) | r

const BG = rgb(10, 10, 12)
const COLORS: Record<number, number[]> = {
  [SAND]: [rgb(232, 196, 120), rgb(222, 184, 106), rgb(240, 206, 136), rgb(212, 174, 98)],
  [RUBBLE]: [rgb(120, 128, 142), rgb(104, 112, 126), rgb(136, 144, 158), rgb(96, 102, 116)],
  [BLOCK]: [rgb(72, 84, 108), rgb(66, 78, 100), rgb(78, 90, 114), rgb(70, 80, 104)],
}
const MORTAR = rgb(42, 50, 66)
const BOMB_BODY = rgb(34, 34, 40)
const BOMB_SHINE = rgb(125, 211, 252)
const BOMB_HOT = rgb(232, 64, 52)
const SPARK = [rgb(255, 236, 140), rgb(255, 150, 50)]

function fireColor(life: number) {
  if (life > 12) return rgb(255, 240, 180)
  if (life > 7) return rgb(255, 170, 60)
  if (life > 3) return rgb(230, 80, 40)
  return rgb(110, 40, 30)
}

function render(w: World, buf: Uint32Array) {
  const { cells, shade, life } = w
  for (let i = 0; i < W * H; i++) {
    const t = cells[i]
    if (t === SAND || t === RUBBLE) {
      buf[i] = COLORS[t][shade[i]]
    } else if (t === BLOCK) {
      const x = i % W
      const y = (i / W) | 0
      const mortar = y % 4 === 3 || (x + ((y >> 2) & 1) * 4) % 8 === 7
      buf[i] = mortar ? MORTAR : COLORS[BLOCK][shade[i]]
    } else if (t === FIRE) {
      buf[i] = fireColor(life[i])
    } else {
      buf[i] = BG
    }
  }

  for (const b of w.bombs) {
    const hot = b.fuse < 40 && (b.fuse >> 2) & 1
    for (const [dx, dy] of disk(b.r)) {
      const shine = dx === -1 && dy === -1
      buf[(b.y + dy) * W + b.x + dx] = hot ? BOMB_HOT : shine ? BOMB_SHINE : BOMB_BODY
    }
    const sy = b.y - b.r - 1
    if (sy >= 0) buf[sy * W + b.x] = SPARK[(w.frame >> 1) & 1]
  }

  for (const p of w.particles) {
    const x = p.x | 0
    const y = Math.floor(p.y)
    if (inside(x, y)) buf[y * W + x] = COLORS[p.type][p.shade]
  }
}

type Sound = { ctx: AudioContext; noise: AudioBuffer; last: number }

function createSound(): Sound {
  const ctx = new AudioContext()
  const length = (ctx.sampleRate * 0.8) | 0
  const noise = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
  return { ctx, noise, last: 0 }
}

function boom(sound: Sound, size: number) {
  const { ctx } = sound
  // a chain of twenty bombs should not be twenty times louder
  if (ctx.currentTime - sound.last < 0.05) return
  sound.last = ctx.currentTime
  const source = ctx.createBufferSource()
  source.buffer = sound.noise
  source.playbackRate.value = 13 / size
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  const gain = ctx.createGain()
  gain.gain.value = 0.35
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start()
}

const TOOLS: { id: Tool; label: string; short?: string; icon: typeof BombIcon }[] = [
  { id: 'bomb', label: 'Бомба', icon: BombIcon },
  { id: 'mega', label: 'Мегабомба', short: 'Мега', icon: BombIcon },
  { id: 'sand', label: 'Песок', icon: HourglassIcon },
  { id: 'block', label: 'Блоки', icon: BrickWallIcon },
  { id: 'erase', label: 'Ластик', icon: EraserIcon },
]

const BUTTON =
  'glass inline-flex cursor-pointer touch-manipulation items-center justify-center transition-colors duration-200'

// on phones the tools are a single row of icon tiles, from sm up they are pills
const TOOL_BUTTON = `${BUTTON} flex-col gap-1 rounded-xl px-1 py-2 text-[11px] sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1.5 sm:text-sm`
const ACTION_BUTTON = `${BUTTON} gap-1.5 rounded-full px-2 py-1.5 text-xs text-zinc-300 hover:text-zinc-50 sm:px-3 sm:text-sm`

export function SandBombs() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const soundRef = useRef<Sound | null>(null)
  const pointerRef = useRef({ x: 0, y: 0, down: false })
  const toolRef = useRef<Tool>('bomb')
  const mutedRef = useRef(false)
  const [tool, setTool] = useState<Tool>('bomb')
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const size = gridSize(canvas.parentElement ?? canvas)
    W = size.w
    H = size.h
    canvas.width = W
    canvas.height = H
    canvas.style.aspectRatio = `${W} / ${H}`
    const world = createWorld()
    buildScene(world)
    worldRef.current = world
    const image = ctx.createImageData(W, H)
    const buf = new Uint32Array(image.data.buffer)
    const onBoom = (size: number) => {
      if (soundRef.current && !mutedRef.current) boom(soundRef.current, size)
    }

    // fixed timestep, so a 120 Hz screen doesn't run the sand twice as fast
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      acc += Math.min(now - last, 100)
      last = now
      while (acc >= TICK) {
        acc -= TICK
        const pointer = pointerRef.current
        if (pointer.down && toolRef.current === 'sand') paint(world, pointer.x, pointer.y, 'sand')
        step(world, onBoom)
      }
      render(world, buf)
      ctx.putImageData(image, 0, 0)
      const s = world.shake
      canvas.style.transform =
        s > 0.3 ? `translate(${(Math.random() - 0.5) * s}px, ${(Math.random() - 0.5) * s}px)` : ''
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      soundRef.current?.ctx.close()
      soundRef.current = null
    }
  }, [])

  const selectTool = (next: Tool) => {
    toolRef.current = next
    setTool(next)
  }

  const toggleMuted = () => {
    mutedRef.current = !mutedRef.current
    setMuted(mutedRef.current)
  }

  const toCell = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.floor(((e.clientX - rect.left) / rect.width) * W),
      y: Math.floor(((e.clientY - rect.top) / rect.height) * H),
    }
  }

  // paints every cell between two pointer samples so fast strokes stay unbroken
  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const world = worldRef.current
    const current = toolRef.current
    if (!world || current === 'bomb' || current === 'mega') return
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1)
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(from.x + ((to.x - from.x) * s) / steps)
      const y = Math.round(from.y + ((to.y - from.y) * s) / steps)
      paint(world, x, y, current)
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    // browsers only allow audio to start from a user gesture
    if (!soundRef.current) soundRef.current = createSound()
    const cell = toCell(e)
    pointerRef.current = { ...cell, down: true }
    const world = worldRef.current
    const current = toolRef.current
    if (world && (current === 'bomb' || current === 'mega')) placeBomb(world, cell.x, cell.y, current)
    else stroke(cell, cell)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = pointerRef.current
    if (!pointer.down) return
    const cell = toCell(e)
    stroke(pointer, cell)
    pointer.x = cell.x
    pointer.y = cell.y
  }

  const onPointerUp = () => {
    pointerRef.current.down = false
  }

  const detonateAll = () => {
    worldRef.current?.bombs.forEach((b, i) => {
      b.fuse = Math.min(b.fuse, 1 + i * 3)
    })
  }

  const reset = () => {
    if (worldRef.current) buildScene(worldRef.current)
  }

  const clear = () => {
    const world = worldRef.current
    if (!world) return
    world.cells.fill(EMPTY)
    world.bombs = []
    world.particles = []
  }

  return (
    <div className="select-none [-webkit-touch-callout:none]">
      <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
        {TOOLS.map(({ id, label, short, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTool(id)}
            aria-pressed={tool === id}
            className={`${TOOL_BUTTON} ${tool === id ? 'border-sky-300/60 text-sky-200' : 'text-zinc-300 hover:text-zinc-50'}`}
          >
            <Icon className={id === 'mega' ? 'h-5 w-5' : 'h-4 w-4'} />
            <span className="sm:hidden">{short ?? label}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 overflow-hidden sm:mt-4 rounded-2xl bg-zinc-950/60 p-1 ring-1 ring-white/10 ring-inset">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ aspectRatio: `${W} / ${H}` }}
          className="block w-full cursor-crosshair touch-none rounded-xl [image-rendering:pixelated]"
        />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 sm:mt-4 sm:flex sm:flex-wrap sm:gap-2">
        <button type="button" onClick={detonateAll} className={ACTION_BUTTON}>
          <ZapIcon className="h-4 w-4" />
          Взорвать всё
        </button>
        <button type="button" onClick={reset} className={ACTION_BUTTON}>
          <RotateCcwIcon className="h-4 w-4" />
          Заново
        </button>
        <button type="button" onClick={clear} className={ACTION_BUTTON}>
          <Trash2Icon className="h-4 w-4" />
          Очистить
        </button>
        <button
          type="button"
          onClick={toggleMuted}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
          className={ACTION_BUTTON}
        >
          {muted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
