'use client'

import { useEffect, useRef, useState } from 'react'

export function IndexLab() {
  const frame = useRef<HTMLIFrameElement>(null)
  const observer = useRef<ResizeObserver | null>(null)
  const [height, setHeight] = useState(1100)

  useEffect(() => () => observer.current?.disconnect(), [])

  function resizeToContent() {
    observer.current?.disconnect()
    const body = frame.current?.contentDocument?.body
    if (!body) return
    const resize = () => setHeight(Math.ceil(body.getBoundingClientRect().height))
    observer.current = new ResizeObserver(resize)
    observer.current.observe(body)
    resize()
  }

  return (
    <iframe
      ref={frame}
      src="/labs/index-lab.html"
      title="Индексная — интерактивная лаборатория индексов"
      onLoad={resizeToContent}
      className="block w-full border-0"
      style={{ height, colorScheme: 'light' }}
    />
  )
}
