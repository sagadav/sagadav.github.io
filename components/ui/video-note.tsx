'use client'
import { PlayIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// A Telegram-style round video: tap to play with sound, tap again to pause, a ring
// around the edge shows progress. Starting one note pauses whichever was playing.

let current: HTMLVideoElement | null = null

const RADIUS = 48
const LENGTH = 2 * Math.PI * RADIUS

export function VideoNote({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video || !playing) return
    let raf = 0
    const tick = () => {
      const progress = video.duration ? video.currentTime / video.duration : 0
      ringRef.current?.setAttribute('stroke-dashoffset', String(LENGTH * (1 - progress)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const toggle = () => {
    const video = ref.current
    if (!video) return
    if (!video.paused) {
      video.pause()
      return
    }
    if (current && current !== video) current.pause()
    current = video
    video.play()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Пауза' : 'Смотреть'}
      className="group relative aspect-square w-full cursor-pointer rounded-full"
    >
      {/* #t nudges iOS into showing the first frame instead of a black circle */}
      <video
        ref={ref}
        src={`${src}#t=0.001`}
        preload="metadata"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(e) => {
          e.currentTarget.currentTime = 0
          setPlaying(false)
        }}
        className="h-full w-full rounded-full object-cover ring-1 ring-white/10"
      />
      <svg
        viewBox="0 0 100 100"
        className={`pointer-events-none absolute -inset-1.5 -rotate-90 transition-opacity duration-200 ${playing ? 'opacity-100' : 'opacity-0'}`}
      >
        <circle
          ref={ringRef}
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="rgb(125 211 252)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH}
        />
      </svg>
      {!playing && (
        <span className="glass absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors group-hover:border-sky-300/60">
          <PlayIcon className="ml-0.5 h-5 w-5 fill-zinc-100 text-zinc-100" />
        </span>
      )}
    </button>
  )
}
