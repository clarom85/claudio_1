'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Crown } from 'lucide-react'
import Link from 'next/link'

export default function PremiumSuccessPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Invalidate payment status cache
    queryClient.invalidateQueries({ queryKey: ['payment-status'] })
    queryClient.invalidateQueries({ queryKey: ['my-profile'] })

    const timer = setTimeout(() => router.push('/discover'), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-aura-dark text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* Animated crown */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 blur-2xl opacity-30 animate-pulse" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 flex items-center justify-center">
            <Crown size={48} className="text-yellow-400" />
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold gradient-text mb-3">Welcome to Premium!</h1>
        <p className="text-white/60 mb-2">Your subscription is now active.</p>
        <p className="text-white/40 text-sm mb-8">Enjoy unlimited likes, AI features, and more.</p>

        <Link href="/discover" className="btn-primary text-lg py-4 px-8">
          Start Discovering ✨
        </Link>

        <p className="text-white/30 text-xs mt-6">Redirecting automatically in 5 seconds...</p>
      </motion.div>
    </div>
  )
}
