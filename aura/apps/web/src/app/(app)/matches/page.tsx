'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, MessageCircle, Zap } from 'lucide-react'
import { AuraCanvas } from '@/components/aura/AuraCanvas'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import type { AuraData } from '@aura/shared'

interface Match {
  id: string
  matchedAt: string
  compatibilityScore: number | null
  vibeScore: number | null
  vibeTrend: string | null
  partner: {
    id: string
    name: string
    photo: string | null
    auraData: AuraData | null
    isOnline: boolean
    lastSeenAt: string | null
  }
  lastMessage: {
    content: string | null
    type: string
    isOwn: boolean
    createdAt: string
    isRead: boolean
  } | null
  unreadCount: number
}

export default function MatchesPage() {
  const [tab, setTab] = useState<'matches' | 'likes'>('matches')

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get<{ data: Match[] }>('/api/matches').then((r) => r.data),
    refetchInterval: 30000,
  })

  const matches = data ?? []

  const vibeTrendIcon = (trend: string | null) => {
    if (trend === 'rising') return '📈'
    if (trend === 'declining') return '📉'
    return '➡️'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-display text-2xl font-bold gradient-text mb-4">Your Matches</h1>

        {/* Tabs */}
        <div className="flex gap-2 p-1 glass rounded-xl">
          {(['matches', 'likes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t === 'matches' ? `💜 Matches (${matches.length})` : '❤️ Liked you'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3 mt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-2xl" />
            ))}
          </div>
        ) : tab === 'matches' ? (
          <AnimatePresence>
            {matches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 text-center"
              >
                <div className="text-5xl mb-4">💜</div>
                <h2 className="font-display text-xl font-bold mb-2">No matches yet</h2>
                <p className="text-white/40 text-sm">Keep swiping — your aura will find its match</p>
                <Link href="/discover" className="btn-primary mt-6">
                  Discover People
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3 mt-2">
                {matches.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/messages/${match.id}`}>
                      <div className="flex items-center gap-3 p-3 glass rounded-2xl hover:bg-white/8 active:scale-[0.98] transition-all">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {match.partner.photo ? (
                            <img
                              src={match.partner.photo}
                              alt={match.partner.name}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : match.partner.auraData ? (
                            <AuraCanvas auraData={match.partner.auraData} size={56} />
                          ) : (
                            <div className="w-14 h-14 rounded-full glass flex items-center justify-center text-xl">
                              ✨
                            </div>
                          )}
                          {/* Online indicator */}
                          {match.partner.isOnline && (
                            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-aura-dark" />
                          )}
                          {/* Unread badge */}
                          {match.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold">
                              {match.unreadCount}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="font-semibold">{match.partner.name}</h3>
                            <span className="text-xs text-white/30">
                              {match.lastMessage
                                ? formatDistanceToNow(new Date(match.lastMessage.createdAt), { addSuffix: true })
                                : formatDistanceToNow(new Date(match.matchedAt), { addSuffix: true })}
                            </span>
                          </div>

                          {/* Last message or CTA */}
                          {match.lastMessage ? (
                            <p className={`text-sm truncate ${
                              !match.lastMessage.isRead && !match.lastMessage.isOwn
                                ? 'text-white font-medium'
                                : 'text-white/50'
                            }`}>
                              {match.lastMessage.isOwn ? 'You: ' : ''}
                              {match.lastMessage.content ?? `[${match.lastMessage.type.toLowerCase()}]`}
                            </p>
                          ) : (
                            <p className="text-sm text-violet-400">Say hello! ✨</p>
                          )}
                        </div>

                        {/* Compatibility + Vibe */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {match.compatibilityScore !== null && (
                            <div className="text-xs font-semibold text-violet-300">
                              {match.compatibilityScore}%
                            </div>
                          )}
                          {match.vibeScore !== null && (
                            <div className="text-xs text-white/40 flex items-center gap-0.5">
                              {vibeTrendIcon(match.vibeTrend)}
                              <span>{match.vibeScore}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        ) : (
          // Likes tab — Premium feature
          <LikesTab />
        )}
      </div>
    </div>
  )
}

function LikesTab() {
  const { data: status } = useQuery({
    queryKey: ['payment-status'],
    queryFn: () => api.get<{ data: { isPremium: boolean } }>('/api/payments/status').then((r) => r.data),
  })

  if (!status?.isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 text-center"
      >
        {/* Blurred preview of likes */}
        <div className="relative mb-6">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl glass overflow-hidden">
                <div className="w-full h-full skeleton" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-aura-dark/60 backdrop-blur-sm rounded-2xl">
            <div className="text-4xl mb-2">❤️</div>
            <p className="font-semibold text-lg">People liked you!</p>
            <p className="text-white/50 text-sm">Upgrade to see who</p>
          </div>
        </div>

        <Link href="/premium" className="btn-primary inline-flex items-center gap-2">
          <Zap size={16} />
          Upgrade to Gold
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="mt-4 text-center text-white/40">
      <p>No new likes yet</p>
    </div>
  )
}
