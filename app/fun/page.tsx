import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRightIcon } from 'lucide-react'
import { FUN_LINKS } from '../data'

export const metadata: Metadata = {
  title: 'FUN — Сагадеев Артур',
}

const MONO = 'font-[family-name:var(--font-geist-mono)]'

export default function Fun() {
  return (
    <main className="mt-16 pb-16">
      <p className={`${MONO} mb-2 text-xs tracking-widest text-sky-300 uppercase`}>
        {'// '}fun
      </p>
      <h1 className="text-4xl font-semibold tracking-tighter text-zinc-50 sm:text-5xl">FUN</h1>
      <div className="mt-10 flex flex-col gap-3">
        {FUN_LINKS.map((item) => (
          <Link
            key={item.link}
            href={item.link}
            className="glass group flex items-start justify-between gap-4 rounded-2xl p-5 transition-colors duration-200 hover:border-sky-300/40"
          >
            <div className="space-y-1">
              <h2 className="font-medium text-zinc-50 transition-colors group-hover:text-sky-200">
                {item.title}
              </h2>
              <p className="text-zinc-400">{item.description}</p>
            </div>
            <ArrowUpRightIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-300" />
          </Link>
        ))}
      </div>
    </main>
  )
}
