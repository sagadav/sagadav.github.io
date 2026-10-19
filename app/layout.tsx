import type { Metadata, Viewport } from 'next'
import { Onest, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { ThemeProvider } from 'next-themes'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'Сагадеев Артур — fullstack-разработчик',
  description:
    'Fullstack-разработчик: Laravel, Symfony на бэкенде, Vue, Quasar, React на фронтенде, React Native для мобильных приложений.',
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
        className={`${geist.variable} ${geistMono.variable} bg-black tracking-tight text-zinc-100 antialiased`}
      >
        <ThemeProvider attribute="class" storageKey="theme" forcedTheme="dark">
          <div className="flex min-h-screen w-full flex-col overflow-x-clip font-[family-name:var(--font-geist)]">
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
