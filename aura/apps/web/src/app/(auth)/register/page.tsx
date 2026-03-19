'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Sparkles, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const passwordStrength = (() => {
    if (password.length === 0) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return toast.error('Please accept the terms')
    if (passwordStrength < 2) return toast.error('Password too weak')

    setLoading(true)
    try {
      const res = await api.post<{ data: { accessToken: string; refreshToken: string } }>(
        '/api/auth/register',
        { name, email, password }
      )
      setAuth({ id: '', email, name }, res.data.accessToken, res.data.refreshToken)
      router.push('/onboarding')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-aura-dark">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={24} className="text-violet-400" />
            <span className="font-display text-3xl font-bold gradient-text">AURA</span>
          </div>
          <p className="text-white/40">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm text-white/50 mb-1.5 block">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we call you?"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/50 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/50 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="input-field pr-12"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/40">{strengthLabels[passwordStrength - 1] ?? 'Too short'}</p>
              </div>
            )}
          </div>

          {/* Terms */}
          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 text-left w-full"
          >
            <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all ${
              agreed ? 'bg-violet-600' : 'glass'
            }`}>
              {agreed && <Check size={12} strokeWidth={3} />}
            </div>
            <p className="text-sm text-white/50">
              I agree to the{' '}
              <span className="text-violet-400">Terms of Service</span> and{' '}
              <span className="text-violet-400">Privacy Policy</span>
            </p>
          </button>

          <button
            type="submit"
            disabled={loading || !agreed}
            className="btn-primary w-full py-4 text-base disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create Account ✨'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
