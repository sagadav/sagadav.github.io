'use client'
import { TextMorph } from '@/components/ui/text-morph'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BLOG_POSTS } from '../data'

const MONO = 'font-[family-name:var(--font-geist-mono)]'

function CopyButton() {
  const [text, setText] = useState('Скопировать')
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    const timer = setTimeout(() => {
      setText('Скопировать')
    }, 2000)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <button
      onClick={() => {
        setText('Скопировано')
        navigator.clipboard.writeText(currentUrl)
      }}
      className="flex items-center gap-1 text-zinc-500 transition-colors hover:text-sky-300"
      type="button"
    >
      <TextMorph>{text}</TextMorph>
      <span>ссылку</span>
    </button>
  )
}

export default function LayoutBlogPost({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const post = BLOG_POSTS.find((p) => pathname?.replace(/\/$/, '') === p.link)

  return (
    <>
      <ScrollProgress
        className="fixed top-0 left-0 z-20 h-0.5 bg-sky-300"
        springOptions={{
          bounce: 0,
        }}
      />

      <div className={`${MONO} mt-16 flex items-center justify-between text-xs`}>
        <Link
          href="/#blog"
          className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-sky-300"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" /> все статьи
        </Link>
        <CopyButton />
      </div>

      <article className="glass mt-4 rounded-3xl p-6 pb-12 sm:p-10">
        {post && (
          <p className={`${MONO} mb-6 text-xs tracking-widest text-sky-300 uppercase`}>
            {'// '}{post.date} · {post.readingTime}
          </p>
        )}
        <div className="prose prose-invert max-w-none prose-headings:text-zinc-50 prose-h1:text-3xl prose-h1:font-semibold prose-h1:tracking-tight prose-h2:mt-12 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:font-medium prose-h3:text-base prose-h3:font-medium prose-p:text-zinc-300 prose-a:text-sky-300 prose-a:no-underline hover:prose-a:underline prose-strong:font-medium prose-strong:text-zinc-100 prose-code:rounded prose-code:bg-white/10 prose-code:text-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/60 prose-hr:border-white/10 [&_pre_code]:bg-transparent [&_pre_code]:p-0">
          {children}
        </div>
      </article>
    </>
  )
}
