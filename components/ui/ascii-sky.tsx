'use client'
import { useEffect, useRef } from 'react'

// Animated ascii dusk: the sun sinks into a drifting sea of cloud.
// Brightness picks the dot size of ` ·•●` (ordered 4x4 Bayer dithering), warmth picks the hue.

const CELL = 10
const FPS = 15
// dot radii as a share of the cell, drawn as circles so they don't depend on the OS font
const DOTS = [0.13, 0.26, 0.42]
const LEVELS = 16
const WARMTH = 8

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16))

const COOL: [number, number, number][] = [
  [48, 48, 54],
  [138, 138, 145],
]
const WARM: [number, number, number][] = [
  [110, 50, 18],
  [243, 128, 32],
  [255, 240, 220],
]

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

function colorFor(level: number, warmth: number) {
  const l = level / (LEVELS - 1)
  const w = warmth / (WARMTH - 1)
  const cool = ramp(COOL, l)
  const warm = ramp(WARM, l)
  const [r, g, b] = cool.map((c, k) => Math.round(lerp(c, warm[k], w)))
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

// Pre-rendered dots for every (size, level, warmth), so a frame is just drawImage calls.
function buildAtlas(dpr: number) {
  const size = CELL * dpr
  const atlas = document.createElement('canvas')
  atlas.width = size * DOTS.length * LEVELS
  atlas.height = size * WARMTH
  const ctx = atlas.getContext('2d')!
  for (let w = 0; w < WARMTH; w++) {
    for (let l = 0; l < LEVELS; l++) {
      ctx.fillStyle = colorFor(l, w)
      DOTS.forEach((radius, d) => {
        ctx.beginPath()
        ctx.arc(
          (d * LEVELS + l) * size + size / 2,
          w * size + size / 2,
          radius * size,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      })
    }
  }
  return { atlas, size }
}

function sample(u: number, v: number, aspect: number, t: number) {
  const horizon = 0.6
  const sunX = 0.7
  const sunR = 0.12
  const dx = (u - sunX) * aspect
  const dy = v - horizon
  const sunDist = Math.sqrt(dx * dx + dy * dy)
  const pulse = 1 + 0.04 * Math.sin(t * 0.8)
  const glow = Math.exp(-Math.max(0, sunDist - sunR) * 6) * pulse

  // cloud sea: an undulating surface that drifts left
  const surface =
    horizon - 0.01 + 0.06 * (fbm(u * aspect * 2.5 + t * 0.02, 1.7) - 0.5)
  const depth = v - surface

  if (depth < 0) {
    const h = v / horizon
    let bright = 0.06 + 0.35 * Math.pow(h, 5) + glow * 0.5
    let warmth = clamp01(Math.pow(h, 3) * 0.9 + glow * 1.4)

    if (sunDist < sunR * pulse) {
      bright = 1
      warmth = 0.75 + 0.25 * (1 - sunDist / sunR)
    }

    // thin haze bands crossing the sun
    const band = fbm(u * aspect * 1.2 + t * 0.04, v * 18)
    bright -= Math.max(0, band - 0.55) * 1.2 * glow

    // stars in the upper sky
    if (h < 0.75) {
      const s = hash(Math.floor(u * 300), Math.floor(v * 300))
      if (s > 0.993) {
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + s * 3) + s * 50)
        bright = Math.max(bright, 0.3 + 0.5 * tw * (1 - h))
        warmth = Math.min(warmth, 0.15)
      }
    }
    return [bright, warmth]
  }

  // nearer rows drift faster; light comes from above, so upward edges glow
  const speed = 0.03 + 0.25 * depth
  const x = u * aspect * 3.2 + t * speed
  const n = fbm(x, v * 9)
  const nUp = fbm(x, (v - 0.025) * 9)
  const billow = clamp01((n - 0.3) * 3)
  const lit = clamp01((n - nUp) * 7 + 0.35)
  const sunLight =
    0.3 + 0.7 * Math.exp(-Math.abs(dx) * 1.6) * Math.exp(-depth * 2.5)
  const shimmer = 0.5 + 0.5 * Math.sin(u * 50 - t * 1.4 + n * 9)

  let bright =
    0.07 +
    billow * (0.25 + 0.75 * lit * sunLight + 0.08 * shimmer) +
    glow * 0.5 * Math.exp(-depth * 18)
  const warmth = clamp01(0.15 + 0.85 * sunLight * lit + glow * 0.6)

  // fade into the ground at the bottom
  bright *= clamp01((1 - v) * 3)
  return [bright, warmth]
}

export function AsciiSky({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { atlas, size } = buildAtlas(dpr)
    let cols = 0
    let rows = 0
    let raf = 0
    let last = 0
    const start = performance.now()

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.ceil(w * dpr)
      canvas.height = Math.ceil(h * dpr)
      cols = Math.ceil(w / CELL)
      rows = Math.ceil(h / CELL)
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const aspect = cols / rows
      for (let y = 0; y < rows; y++) {
        const v = (y + 0.5) / rows
        for (let x = 0; x < cols; x++) {
          const u = (x + 0.5) / cols
          const [bright, warmth] = sample(u, v, aspect, t)
          const level = clamp01(bright) * DOTS.length + BAYER[y & 3][x & 3] - 0.5
          const g = Math.floor(level)
          if (g < 0) continue
          const dot = Math.min(g, DOTS.length - 1)
          const l = Math.round(clamp01(bright) * (LEVELS - 1))
          const w = Math.round(clamp01(warmth) * (WARMTH - 1))
          ctx.drawImage(
            atlas,
            (dot * LEVELS + l) * size,
            w * size,
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
        draw(0)
      } else {
        raf = requestAnimationFrame(loop)
      }
    }

    run()
    window.addEventListener('resize', run)
    document.addEventListener('visibilitychange', run)
    reduceMotion.addEventListener('change', run)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', run)
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
