import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'AURA — Connect Beyond the Surface',
  description: 'Find your perfect match through personality, not just photos.',
  openGraph: {
    title: 'AURA Dating',
    description: 'Personality-first dating that reveals who you truly are.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-aura-dark text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
