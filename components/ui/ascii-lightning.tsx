'use client'
import { useEffect, useRef } from 'react'

// Animated ascii storm: a drifting cloud, a stepped leader crawling down, then a
// flickering return stroke with branches. Brightness picks the dot size of ` ·•●`
// (ordered 4x4 Bayer dithering), charge picks the hue from storm grey to electric.

const CELL = 9
// on a narrow canvas (phones) the dots keep their size but sit further apart, so the
// bolt reads as scattered sparks instead of a solid smear
const SPARSE_WIDTH = 480
const SPARSE_CELL = 13
const FPS = 24
// dot radii as a share of the cell, drawn as circles so they don't depend on the OS font
const DOTS = [0.13, 0.26, 0.42]
const LEVELS = 16
const CHARGE = 8

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

const STORM: [number, number, number][] = [
  [34, 34, 46],
  [110, 112, 140],
]
const ELECTRIC: [number, number, number][] = [
  [40, 70, 160],
  [120, 180, 255],
  [240, 248, 255],
]

// stroke timeline, seconds from the start of a strike
const LEADER = 0.22
const FLICKER = [1, 0.25, 0.95, 0.15, 0.8, 0.5]
const FLICKER_STEP = 0.06
const AFTERGLOW = 0.7

type Segment = { x1: number; y1: number; x2: number; y2: number; power: number }

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function ramp(stops: [number, number, number][], t: number) {
  const p = clamp01(t) * (stops.length - 1)
  const i = Math.min(Math.floor(p), stops.length - 2)
  const f = p - i
  return stops[i].map((c, k) => lerp(c, stops[i + 1][k], f))
}

function colorFor(level: number, charge: number) {
  const l = level / (LEVELS - 1)
  const c = charge / (CHARGE - 1)
  const storm = ramp(STORM, l)
  const electric = ramp(ELECTRIC, l)
  const [r, g, b] = storm.map((s, k) => Math.round(lerp(s, electric[k], c)))
  return `rgb(${r},${g},${b})`
}

function hash(x: number, y: number) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return h - Math.floor(h)
}

function noise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return lerp(lerp(a, b, u), lerp(c, d, u), v)
}

function fbm(x: number, y: number) {
  let sum = 0
  let amp = 0.5
  for (let o = 0; o < 4; o++) {
    sum += amp * noise(x, y)
    x *= 2.03
    y *= 2.03
    amp *= 0.5
  }
  return sum
}

// Pre-rendered dots for every (size, level, charge), so a frame is just drawImage calls.
function buildAtlas(dpr: number, cell: number) {
  const size = cell * dpr
  // dot radii are tuned for CELL; a wider cell only adds gap around the same dot
  const scale = CELL / cell
  const atlas = document.createElement('canvas')
  atlas.width = size * DOTS.length * LEVELS
  atlas.height = size * CHARGE
  const ctx = atlas.getContext('2d')!
  for (let c = 0; c < CHARGE; c++) {
    for (let l = 0; l < LEVELS; l++) {
      ctx.fillStyle = colorFor(l, c)
      DOTS.forEach((radius, d) => {
        ctx.beginPath()
        ctx.arc(
          (d * LEVELS + l) * size + size / 2,
          c * size + size / 2,
          radius * scale * size,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      })
    }
  }
  return { atlas, size }
}

// A jagged walk from the cloud base to the ground, in cell coordinates, with side branches.
function makeBolt(cols: number, rows: number, sparse: boolean) {
  const segments: Segment[] = []
  const walk = (
    x: number,
    y: number,
    drift: number,
    steps: number,
    power: number,
    depth: number,
  ) => {
    for (let i = 0; i < steps && y < rows; i++) {
      const nx = x + drift * 1.5 + (Math.random() - 0.5) * 4.5
      const ny = y + 1 + Math.random() * 2.2
      segments.push({ x1: x, y1: y, x2: nx, y2: ny, power })
      const branchChance = (depth ? 0.06 : 0.11) * (sparse ? 2 : 1)
      if (depth < 2 && Math.random() < branchChance) {
        const side = Math.random() < 0.5 ? -1 : 1
        walk(nx, ny, side * (0.8 + Math.random()), 6 + Math.random() * 14, power * 0.45, depth + 1)
      }
      x = Math.max(1, Math.min(cols - 2, nx))
      y = ny
    }
  }
  const startX = cols * (0.35 + Math.random() * 0.35)
  walk(startX, rows * 0.2, (Math.random() - 0.5) * 0.6, Infinity, 1, 0)
  return segments
}

// Light from the bolt at every cell: a hot core plus a soft halo, and the row each cell
// lights up at, so the stepped leader can reveal it top to bottom.
function rasterizeBolt(segments: Segment[], cols: number, rows: number, halo: number) {
  const light = new Float32Array(cols * rows)
  const reach = new Float32Array(cols * rows).fill(Infinity)
  const R = 6
  for (const s of segments) {
    const minX = Math.max(0, Math.floor(Math.min(s.x1, s.x2) - R))
    const maxX = Math.min(cols - 1, Math.ceil(Math.max(s.x1, s.x2) + R))
    const minY = Math.max(0, Math.floor(Math.min(s.y1, s.y2) - R))
    const maxY = Math.min(rows - 1, Math.ceil(Math.max(s.y1, s.y2) + R))
    const dx = s.x2 - s.x1
    const dy = s.y2 - s.y1
    const len2 = dx * dx + dy * dy || 1
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const t = clamp01(((x - s.x1) * dx + (y - s.y1) * dy) / len2)
        const px = s.x1 + dx * t - x
        const py = s.y1 + dy * t - y
        const d2 = px * px + py * py
        const v = s.power * (Math.exp(-d2 * 1.1) + halo * Math.exp(-d2 * 0.09))
        const i = y * cols + x
        if (v > light[i]) light[i] = v
        if (v > 0.05) reach[i] = Math.min(reach[i], s.y1 + dy * t)
      }
    }
  }
  return { light, reach }
}

function strikeLevel(t: number) {
  if (t < LEADER) return 0
  const f = Math.floor((t - LEADER) / FLICKER_STEP)
  if (f < FLICKER.length) return FLICKER[f]
  const after = t - LEADER - FLICKER.length * FLICKER_STEP
  return after < AFTERGLOW ? 0.5 * Math.exp(-after * 5) : 0
}

export function AsciiLightning({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let atlas: HTMLCanvasElement | null = null
    let size = 0
    let cell = 0
    let sparse = false
    let cols = 0
    let rows = 0
    let raf = 0
    let last = 0
    let bolt: ReturnType<typeof rasterizeBolt> | null = null
    let strikeAt = 0
    let nextStrike = 0.6
    const start = performance.now()

    const strike = (t: number) => {
      bolt = rasterizeBolt(makeBolt(cols, rows, sparse), cols, rows, sparse ? 0.12 : 0.28)
      strikeAt = t
      // now and then a second stroke follows right after the first
      nextStrike = t + (Math.random() < 0.25 ? 0.9 : 1.8 + Math.random() * 2.6)
    }

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.ceil(width * dpr)
      canvas.height = Math.ceil(height * dpr)
      const nextSparse = width < SPARSE_WIDTH
      if (!atlas || nextSparse !== sparse) {
        sparse = nextSparse
        cell = sparse ? SPARSE_CELL : CELL
        ;({ atlas, size } = buildAtlas(dpr, cell))
      }
      cols = Math.ceil(width / cell)
      rows = Math.ceil(height / cell)
      bolt = null
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!atlas || !cols || !rows) return
      if (t >= nextStrike) strike(t)

      const since = t - strikeAt
      const flash = bolt ? strikeLevel(since) : 0
      const leaderRow = bolt && since < LEADER ? (since / LEADER) * rows : Infinity

      for (let y = 0; y < rows; y++) {
        const v = (y + 0.5) / rows
        for (let x = 0; x < cols; x++) {
          const u = (x + 0.5) / cols
          let bright = 0
          let charge = 0

          // the storm cloud: solid at the top, thinning into ragged billows lower down,
          // lit from inside by the flash
          if (v < 0.4) {
            const n = fbm(u * 2.6 + t * 0.035, v * 4.5 - t * 0.015)
            const body = clamp01((n - 0.18 - v * 1.5) * 3.2)
            bright = body * (0.22 + 0.25 * n + 0.55 * flash)
            charge = flash * 0.5
          }

          if (bolt) {
            const i = y * cols + x
            const lit = bolt.light[i]
            if (lit > 0.02) {
              let b = 0
              if (since < LEADER) {
                // stepped leader: a dim, crawling channel
                if (bolt.reach[i] <= leaderRow) b = lit * 0.45 * (0.6 + 0.4 * Math.random())
              } else {
                b = lit * flash * (sparse ? 1.4 : 1)
              }
              if (b > bright) {
                bright = b
                charge = 0.55 + 0.45 * clamp01(lit)
              }
            }
          }

          // fade into the ground
          bright *= clamp01((1 - v) * 6)

          const level = clamp01(bright) * DOTS.length + BAYER[y & 3][x & 3] - 1
          const g = Math.floor(level)
          if (g < 0) continue
          const dot = Math.min(g, DOTS.length - 1)
          const l = Math.round(clamp01(bright) * (LEVELS - 1))
          const c = Math.round(clamp01(charge) * (CHARGE - 1))
          ctx.drawImage(
            atlas,
            (dot * LEVELS + l) * size,
            c * size,
            size,
            size,
            x * size,
            y * size,
            size,
            size,
          )
        }
      }
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 1000 / FPS) return
      last = now
      draw((now - start) / 1000)
    }

    const run = () => {
      cancelAnimationFrame(raf)
      resize()
      if (reduceMotion.matches || document.hidden) {
        // a single still frame caught at the brightest moment of a strike
        strike(0)
        draw(LEADER)
      } else {
        nextStrike = (performance.now() - start) / 1000 + 0.6
        raf = requestAnimationFrame(loop)
      }
    }

    run()
    const observer = new ResizeObserver(run)
    observer.observe(canvas)
    document.addEventListener('visibilitychange', run)
    reduceMotion.addEventListener('change', run)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      document.removeEventListener('visibilitychange', run)
      reduceMotion.removeEventListener('change', run)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
