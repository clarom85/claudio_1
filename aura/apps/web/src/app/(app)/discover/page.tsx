'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { SwipeCard } from '@/components/discover/SwipeCard'
import { AuraCanvas } from '@/components/aura/AuraCanvas'
import toast from 'react-hot-toast'
import type { ProfileCard } from '@aura/shared'
import { api } from '@/lib/api'

export default function DiscoverPage() {
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['discovery'],
    queryFn: () => api.get<{ data: ProfileCard[] }>('/api/discovery').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const likeMutation = useMutation({
    mutationFn: ({ targetId, isSuperLike }: { targetId: string; isSuperLike?: boolean }) =>
      api.post('/api/discovery/like', { targetId, isSuperLike: isSuperLike ?? false }),
    onSuccess: (res: any) => {
      if (res.data?.matched) {
        toast.custom((t) => (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-elevated rounded-3xl p-6 text-center max-w-xs mx-auto"
          >
            <div className="text-4xl mb-2">💜</div>
            <h3 className="font-display font-bold text-xl gradient-text">It's a Match!</h3>
            <p className="text-white/60 text-sm mt-1">Your auras aligned</p>
          </motion.div>
        ), { duration: 3000 })
      }
    },
  })

  const passMutation = useMutation({
    mutationFn: (targetId: string) => api.post('/api/discovery/pass', { targetId }),
  })

  const cards = data ?? []

  const handleLike = useCallback((id: string) => {
    likeMutation.mutate({ targetId: id })
    setCurrentIndex((i) => i + 1)
  }, [likeMutation])

  const handlePass = useCallback((id: string) => {
    passMutation.mutate(id)
    setCurrentIndex((i) => i + 1)
  }, [passMutation])

  const handleSuperLike = useCallback((id: string) => {
    likeMutation.mutate({ targetId: id, isSuperLike: true })
    setCurrentIndex((i) => i + 1)
    toast('⭐ Super Like sent!', { icon: '✨' })
  }, [likeMutation])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-48 h-48 skeleton rounded-full" />
        <div className="h-4 w-32 skeleton rounded-full" />
      </div>
    )
  }

  const visibleCards = cards.slice(currentIndex, currentIndex + 3)

  if (visibleCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
        <div className="w-32 h-32 rounded-full glass flex items-center justify-center text-5xl">
          ✨
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold gradient-text">You're all caught up</h2>
          <p className="text-white/50 mt-2">New auras appear daily. Come back tomorrow!</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            setCurrentIndex(0)
            queryClient.invalidateQueries({ queryKey: ['discovery'] })
          }}
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Header */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold gradient-text">Discover</h1>
        <div className="text-white/40 text-sm">{cards.length - currentIndex} left</div>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm" style={{ height: 680 }}>
        <AnimatePresence>
          {visibleCards.map((card, i) => (
            <motion.div
              key={card.id}
              className="absolute w-full"
              style={{
                zIndex: visibleCards.length - i,
                scale: 1 - i * 0.04,
                y: i * 12,
                opacity: i === 2 ? 0.6 : 1,
              }}
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1 - i * 0.04, opacity: i === 2 ? 0.6 : 1, y: i * 12 }}
              exit={{ x: 300, opacity: 0, rotate: 20 }}
            >
              <SwipeCard
                card={card}
                onLike={handleLike}
                onPass={handlePass}
                onSuperLike={handleSuperLike}
                isTop={i === 0}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
