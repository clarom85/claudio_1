'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Camera, Edit2, Crown, Settings, LogOut, Plus, X, GripVertical } from 'lucide-react'
import { AuraCanvas } from '@/components/aura/AuraCanvas'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { AuraData } from '@aura/shared'

interface Profile {
  id: string
  name: string
  bio: string | null
  occupation: string | null
  city: string | null
  completionScore: number
  auraData: AuraData | null
  photos: { id: string; url: string; order: number }[]
  interests: string[]
  prompts: { id: string; question: string; answer: string }[]
  isPremium: boolean
  subscription: { plan: string; currentPeriodEnd: string; cancelAtEnd: boolean } | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState('')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get<{ data: Profile }>('/api/profiles/me').then((r) => r.data),
    onSuccess: (data) => { if (data?.bio) setBio(data.bio) },
  } as any)

  const updateBioMutation = useMutation({
    mutationFn: (newBio: string) => api.patch('/api/profiles/me', { bio: newBio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      setEditingBio(false)
      toast.success('Bio updated!')
    },
  })

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media/photos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      toast.success('Photo uploaded!')
    },
    onError: () => toast.error('Upload failed'),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadPhotoMutation.mutate(file)
  }

  function handleLogout() {
    clearAuth()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    )
  }

  const completionColor = profile && profile.completionScore >= 80 ? '#10b981' : profile && profile.completionScore >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-5 space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold gradient-text">My Profile</h1>
          <div className="flex gap-2">
            <Link href="/premium" className="p-2 rounded-xl glass hover:bg-white/10 transition-colors">
              <Crown size={18} className={profile?.isPremium ? 'text-yellow-400' : 'text-white/40'} />
            </Link>
            <button className="p-2 rounded-xl glass hover:bg-white/10 transition-colors">
              <Settings size={18} className="text-white/60" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-xl glass hover:bg-red-500/20 transition-colors">
              <LogOut size={18} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* Aura + Name */}
        <div className="glass rounded-3xl p-5 flex items-center gap-5">
          {profile?.auraData ? (
            <AuraCanvas auraData={profile.auraData} size={80} />
          ) : (
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center text-2xl">✨</div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold">{profile?.name}</h2>
              {profile?.isPremium && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30">
                  {profile.subscription?.plan?.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-white/50 text-sm">{profile?.city ?? 'Location not set'}</p>

            {/* Profile completion */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">Profile strength</span>
                <span style={{ color: completionColor }}>{profile?.completionScore ?? 0}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${profile?.completionScore ?? 0}%`, background: completionColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Photos</h3>
            <span className="text-xs text-white/40">{profile?.photos.length ?? 0}/6</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {profile?.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {(profile?.photos.length ?? 0) < 6 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
                className="aspect-square rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors border border-dashed border-white/20"
              >
                {uploadPhotoMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={24} className="text-white/40" />
                )}
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Bio */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Bio</h3>
            <button
              onClick={() => editingBio ? updateBioMutation.mutate(bio) : setEditingBio(true)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Edit2 size={16} className="text-white/50" />
            </button>
          </div>
          {editingBio ? (
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={4}
                className="input-field resize-none text-sm"
                placeholder="Tell people something about you..."
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/30">{bio.length}/500</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditingBio(false)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
                  <button onClick={() => updateBioMutation.mutate(bio)} className="btn-primary py-1.5 px-3 text-sm">Save</button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/60 text-sm leading-relaxed">
              {profile?.bio || <span className="text-white/30 italic">No bio yet. Tell people about yourself!</span>}
            </p>
          )}
        </div>

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <div className="glass rounded-3xl p-5">
            <h3 className="font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="px-3 py-1.5 rounded-full glass text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prompts */}
        {profile?.prompts && profile.prompts.length > 0 && (
          <div className="glass rounded-3xl p-5 space-y-3">
            <h3 className="font-semibold">Prompts</h3>
            {profile.prompts.map((prompt) => (
              <div key={prompt.id} className="p-3 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 mb-1">{prompt.question}</p>
                <p className="text-sm text-white/80">{prompt.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Premium subscription info */}
        {profile?.isPremium && profile.subscription && (
          <div className="glass rounded-3xl p-5 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={18} className="text-yellow-400" />
              <h3 className="font-semibold text-yellow-400">{profile.subscription.plan} Active</h3>
            </div>
            <p className="text-sm text-white/50">
              {profile.subscription.cancelAtEnd
                ? `Expires ${new Date(profile.subscription.currentPeriodEnd).toLocaleDateString()}`
                : `Renews ${new Date(profile.subscription.currentPeriodEnd).toLocaleDateString()}`}
            </p>
            <button
              onClick={async () => {
                const res = await api.post<{ data: { url: string } }>('/api/payments/portal', {})
                window.location.href = res.data.url
              }}
              className="btn-secondary mt-3 text-sm py-2"
            >
              Manage Subscription
            </button>
          </div>
        )}

        {!profile?.isPremium && (
          <Link href="/premium">
            <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3">
                <Crown size={24} className="text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Upgrade to Premium</h3>
                  <p className="text-sm text-white/50">Unlimited likes, see who liked you, AI assistant</p>
                </div>
              </div>
              <div className="mt-3 btn-primary inline-block text-sm py-2 px-4">
                Explore Plans →
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
