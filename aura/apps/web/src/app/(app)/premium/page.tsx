'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Crown, Zap, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const PLANS = {
  gold: {
    name: 'Gold',
    emoji: '⭐',
    color: 'from-yellow-500 to-amber-500',
    borderColor: 'border-yellow-500/40',
    glowColor: 'rgba(245, 158, 11, 0.2)',
    monthly: 9.99,
    yearly: 79.99,
    yearlyMonthly: 6.67,
    features: [
      { text: 'Unlimited likes', included: true },
      { text: '5 Super Likes per day', included: true },
      { text: 'See who liked you', included: true },
      { text: '1 Rewind per day', included: true },
      { text: '3 AI conversation suggestions/day', included: true },
      { text: 'Priority in discovery', included: true },
      { text: 'Read receipts', included: true },
      { text: 'AI Ghostwriter', included: false },
      { text: 'Unlimited AI suggestions', included: false },
      { text: 'Monthly Boost', included: false },
    ],
  },
  platinum: {
    name: 'Platinum',
    emoji: '💜',
    color: 'from-violet-500 to-fuchsia-500',
    borderColor: 'border-violet-500/40',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    monthly: 19.99,
    yearly: 159.99,
    yearlyMonthly: 13.33,
    features: [
      { text: 'Unlimited likes', included: true },
      { text: '10 Super Likes per day', included: true },
      { text: 'See who liked you', included: true },
      { text: '3 Rewinds per day', included: true },
      { text: 'Unlimited AI suggestions', included: true },
      { text: 'Priority in discovery', included: true },
      { text: 'Read receipts', included: true },
      { text: 'AI Ghostwriter ✨', included: true },
      { text: '1 Boost per month', included: true },
      { text: 'Exclusive Platinum aura effects', included: true },
    ],
    recommended: true,
  },
}

export default function PremiumPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState<string | null>(null)

  const { data: status } = useQuery({
    queryKey: ['payment-status'],
    queryFn: () => api.get<{ data: { isPremium: boolean; subscription: { plan: string } | null } }>('/api/payments/status').then((r) => r.data),
  })

  async function handleSubscribe(plan: 'gold' | 'platinum') {
    setLoading(plan)
    try {
      const res = await api.post<{ data: { url: string } }>('/api/payments/checkout', { plan, billing })
      window.location.href = res.data.url
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const currentPlan = status?.subscription?.plan

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-5 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/profile" className="p-2 rounded-xl glass hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold gradient-text">Premium</h1>
            <p className="text-white/40 text-sm">Find your match faster</p>
          </div>
        </div>

        {/* Already premium */}
        {status?.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-6 border border-yellow-500/30 flex items-center gap-3"
          >
            <Crown size={20} className="text-yellow-400" />
            <div>
              <p className="font-semibold text-sm">You're on {currentPlan}</p>
              <p className="text-xs text-white/40">Enjoying all premium features</p>
            </div>
          </motion.div>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: '❤️', label: 'Unlimited Likes' },
            { icon: '👁️', label: 'See Likes' },
            { icon: '🤖', label: 'AI Assistant' },
          ].map((f) => (
            <div key={f.label} className="glass rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-xs text-white/60 leading-tight">{f.label}</p>
            </div>
          ))}
        </div>

        {/* Billing toggle */}
        <div className="flex p-1 glass rounded-xl mb-6 relative">
          {billing === 'yearly' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-xs font-bold">
              Save 33%
            </div>
          )}
          {(['monthly', 'yearly'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                billing === b
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg'
                  : 'text-white/50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div className="space-y-4">
          {(Object.entries(PLANS) as [string, typeof PLANS.gold][]).map(([key, plan]) => {
            const isPlanKey = key as 'gold' | 'platinum'
            const isCurrentPlan = currentPlan === key
            const price = billing === 'yearly' ? plan.yearlyMonthly : plan.monthly
            const totalPrice = billing === 'yearly' ? plan.yearly : plan.monthly

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-3xl p-5 glass border ${plan.borderColor} ${
                  (plan as any).recommended ? 'ring-1 ring-violet-500/50' : ''
                }`}
                style={{ boxShadow: `0 0 40px ${plan.glowColor}` }}
              >
                {(plan as any).recommended && (
                  <div className="absolute -top-3 left-5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold">
                    Most Popular
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.emoji}</span>
                    <div>
                      <h2 className={`font-display text-xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                        {plan.name}
                      </h2>
                      {billing === 'yearly' && (
                        <p className="text-xs text-white/40">Billed as {totalPrice}€/year</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl font-bold">
                      {price.toFixed(2)}€
                    </div>
                    <div className="text-xs text-white/40">/month</div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5">
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        feature.included
                          ? `bg-gradient-to-r ${plan.color}`
                          : 'bg-white/10'
                      }`}>
                        {feature.included ? (
                          <Check size={10} strokeWidth={3} />
                        ) : (
                          <span className="text-[8px] text-white/30">–</span>
                        )}
                      </div>
                      <span className={`text-sm ${feature.included ? 'text-white/80' : 'text-white/30'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCurrentPlan ? (
                  <div className="w-full py-3 rounded-xl text-center glass text-white/50 text-sm font-medium">
                    Current Plan ✓
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(isPlanKey)}
                    disabled={!!loading}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
                      bg-gradient-to-r ${plan.color} hover:opacity-90 active:scale-[0.98]
                      shadow-lg disabled:opacity-50`}
                  >
                    {loading === key ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      `Get ${plan.name} →`
                    )}
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Check size={14} className="text-green-400" />
            Cancel anytime — no questions asked
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Check size={14} className="text-green-400" />
            Secure payment via Stripe — we never store your card
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Check size={14} className="text-green-400" />
            Subscriptions auto-renew and can be managed in your profile
          </div>
        </div>
      </div>
    </div>
  )
}
