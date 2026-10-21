import type { Metadata } from 'next'
import Link from 'next/link'
import { SandBombs } from './game'

export const metadata: Metadata = {
  title: 'Песочница с бомбами — Сагадеев Артур',
}

const MONO = 'font-[family-name:var(--font-geist-mono)]'

export default function SandboxPage() {
  return (
    <main className="mt-16 pb-16">
      <Link
        href="/fun"
        className={`${MONO} mb-2 inline-block text-xs tracking-widest text-sky-300 uppercase hover:underline`}
      >
        {'// '}fun
      </Link>
      <h1 className="text-4xl font-semibold tracking-tighter text-zinc-50 sm:text-5xl">
        Песочница с бомбами
      </h1>
      <p className="mt-4 text-zinc-400">
        Ставь бомбы и смотри, как разлетаются песок и блоки. Бомбы, задетые взрывом, детонируют
        следом. Песок, блоки и ластик рисуются с зажатой кнопкой или пальцем.
      </p>
      <div className="mt-8">
        <SandBombs />
      </div>
    </main>
  )
}
