import type { Metadata } from 'next'
import { VideoNote } from '@/components/ui/video-note'
import { VIDEO_NOTES } from '../data'

export const metadata: Metadata = {
  title: 'Кружки из ТГ — Сагадеев Артур',
}

const MONO = 'font-[family-name:var(--font-geist-mono)]'

export default function VideoNotes() {
  return (
    <main className="mt-16 pb-16">
      <p className={`${MONO} mb-2 text-xs tracking-widest text-sky-300 uppercase`}>
        {'// '}telegram
      </p>
      <h1 className="text-4xl font-semibold tracking-tighter text-zinc-50 sm:text-5xl">
        Кружки из ТГ
      </h1>
      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
        {VIDEO_NOTES.map((src) => (
          <VideoNote key={src} src={src} />
        ))}
      </div>
    </main>
  )
}
