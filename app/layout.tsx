import type { Metadata, Viewport } from 'next'
import { Onest, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { ThemeProvider } from 'next-themes'
import { AsciiSky } from '@/components/ui/ascii-sky'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e0e0f',
}

export const metadata: Metadata = {
  title: 'Сагадеев Артур — fullstack-разработчик',
  description:
    'Fullstack-разработчик: Laravel, Django на бэкенде, Vue, React на фронтенде.',
}

const geist = Onest({
  variable: '--font-geist',
  subsets: ['latin', 'cyrillic'],
})

const geistMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} bg-[#0e0e0f] tracking-tight text-zinc-100 antialiased`}
      >
        <ThemeProvider attribute="class" storageKey="theme" forcedTheme="dark">
          <div className="pointer-events-none fixed inset-0 -z-10">
            <AsciiSky />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(14,14,15,0.55)_100%)]" />
          </div>
          <div className="flex min-h-screen w-full flex-col font-[family-name:var(--font-geist)]">
            <div className="relative mx-auto w-full max-w-screen-md flex-1 px-4 pt-8">
              <Header />
              {children}
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
