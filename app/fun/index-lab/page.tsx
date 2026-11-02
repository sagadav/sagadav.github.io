import type { Metadata } from 'next'
import Link from 'next/link'
import { IndexLab } from './lab'

export const metadata: Metadata = {
  title: 'Индексная — лаборатория индексов — Сагадеев Артур',
  description: 'Интерактивная лаборатория индексов: поиск по таблице, покрывающие запросы и живое B+tree.',
}

export default function IndexLabPage() {
  return (
    <main className="mt-16 pb-8">
      <Link
        href="/fun"
        className="mb-6 inline-block font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-sky-300 uppercase hover:underline"
      >
        ← FUN
      </Link>
      <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#f4f4ee]">
        <IndexLab />
      </div>
    </main>
  )
}
