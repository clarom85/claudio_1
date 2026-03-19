'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, MessageCircle, Heart, User, Sparkles } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 glass border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-violet-400" />
          <span className="font-display font-bold text-lg gradient-text">AURA</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="glass border-t border-white/10 px-2 py-2 safe-area-inset-bottom">
        <div className="flex justify-around">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-violet-400'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon
                  size={22}
                  className={active ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}
                  fill={active ? 'currentColor' : 'none'}
                />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
