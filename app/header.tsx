import Link from 'next/link'
import { SOCIAL_LINKS } from './data'

export function Header() {
  return (
    <header className="flex items-center justify-between font-[family-name:var(--font-geist-mono)] text-sm">
      <Link
        href="/"
        className="text-zinc-100 transition-colors hover:text-orange-400"
      >
        <span className="text-orange-400">~/</span>sagadav
      </Link>
      <nav className="flex items-center gap-4 text-zinc-400">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.link}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-orange-400"
          >
            {link.label.toLowerCase()}
          </a>
        ))}
      </nav>
    </header>
  )
}
