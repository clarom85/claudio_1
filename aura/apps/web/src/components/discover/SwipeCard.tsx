'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Heart, X, Star, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { AuraCanvas } from '../aura/AuraCanvas'
import type { ProfileCard } from '@aura/shared'

interface SwipeCardProps {
  card: ProfileCard
  onLike: (id: string) => void
  onPass: (id: string) => void
  onSuperLike: (id: string) => void
  isTop: boolean
}

export function SwipeCard({ card, onLike, onPass, onSuperLike, isTop }: SwipeCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-25, 25])
  const likeOpacity = useTransform(x, [50, 150], [0, 1])
  const passOpacity = useTransform(x, [-150, -50], [1, 0])
  const superLikeOpacity = useTransform(y, [-150, -50], [1, 0])

  function handleDragEnd(_: any, info: { offset: { x: number; y: number } }) {
    if (info.offset.x > 100) onLike(card.id)
    else if (info.offset.x < -100) onPass(card.id)
    else if (info.offset.y < -100) onSuperLike(card.id)
  }

  const hasPhotos = card.photos.length > 0

  return (
    <motion.div
      className="absolute w-full max-w-sm"
      style={{ x, y, rotate }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      dragElastic={0.7}
    >
      <div className="relative h-[600px] rounded-3xl overflow-hidden glass-elevated shadow-2xl">
        {/* Photo / Aura Background */}
        <div className="absolute inset-0">
          {hasPhotos ? (
            <>
              <img
                src={card.photos[currentPhotoIndex]}
                alt={card.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-aura-surface to-aura-elevated">
              <AuraCanvas auraData={card.auraData} size={280} className="animate-float" />
            </div>
          )}
        </div>

        {/* Photo navigation strips */}
        {hasPhotos && card.photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1">
            {card.photos.map((_, i) => (
              <button
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-200"
                style={{ background: i === currentPhotoIndex ? 'white' : 'rgba(255,255,255,0.4)' }}
                onClick={() => setCurrentPhotoIndex(i)}
              />
            ))}
          </div>
        )}

        {/* Swipe indicators */}
        <motion.div
          className="absolute top-8 left-8 px-4 py-2 rounded-xl border-2 border-green-400 text-green-400 font-bold text-2xl rotate-[-15deg]"
          style={{ opacity: likeOpacity }}
        >
          AURA ✓
        </motion.div>
        <motion.div
          className="absolute top-8 right-8 px-4 py-2 rounded-xl border-2 border-red-400 text-red-400 font-bold text-2xl rotate-[15deg]"
          style={{ opacity: passOpacity }}
        >
          NOPE
        </motion.div>
        <motion.div
          className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl border-2 border-yellow-400 text-yellow-400 font-bold text-xl"
          style={{ opacity: superLikeOpacity }}
        >
          ⭐ SUPER
        </motion.div>

        {/* Compatibility badge */}
        {card.compatibilityScore !== undefined && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: card.compatibilityScore >= 80 ? '#10b981' :
                            card.compatibilityScore >= 60 ? '#f59e0b' : '#6366f1',
              }}
            />
            <span className="text-sm font-semibold">{card.compatibilityScore}% match</span>
          </div>
        )}

        {/* Aura pill (always visible) */}
        <div className="absolute top-4 left-4">
          <div className="w-12 h-12 rounded-full overflow-hidden" style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>
            <AuraCanvas auraData={card.auraData} size={48} />
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-2xl font-display font-bold">{card.name}, {card.age}</h2>
              {card.city && <p className="text-white/60 text-sm mt-0.5">📍 {card.city}</p>}
              {card.occupation && <p className="text-white/50 text-sm">{card.occupation}</p>}
            </div>
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="p-2 rounded-full glass"
            >
              {showDetail ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>

          {/* Reveal stage indicator */}
          {card.revealStage === 'AURA_ONLY' && (
            <div className="mb-3 px-3 py-2 rounded-xl glass text-center">
              <p className="text-xs text-violet-300">✨ Keep chatting to reveal their photos</p>
            </div>
          )}

          {/* Interests */}
          {card.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {card.interests.slice(0, 4).map((interest) => (
                <span key={interest} className="px-2.5 py-1 rounded-full glass text-xs font-medium">
                  {interest}
                </span>
              ))}
              {card.interests.length > 4 && (
                <span className="px-2.5 py-1 rounded-full glass text-xs text-white/50">
                  +{card.interests.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Expanded detail */}
          <AnimatePresence>
            {showDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {card.bio && (
                  <p className="text-white/70 text-sm mb-3 leading-relaxed">{card.bio}</p>
                )}
                {card.prompts.map((prompt, i) => (
                  <div key={i} className="mb-2 p-3 rounded-xl glass">
                    <p className="text-white/50 text-xs mb-1">{prompt.question}</p>
                    <p className="text-white text-sm">{prompt.answer}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      {isTop && (
        <div className="flex justify-center items-center gap-5 mt-5">
          <button
            onClick={() => onPass(card.id)}
            className="w-14 h-14 rounded-full glass flex items-center justify-center
                       hover:bg-red-500/20 hover:border-red-500/50 active:scale-90
                       transition-all duration-200 shadow-lg"
          >
            <X size={24} className="text-red-400" />
          </button>

          <button
            onClick={() => onSuperLike(card.id)}
            className="w-12 h-12 rounded-full glass flex items-center justify-center
                       hover:bg-yellow-500/20 hover:border-yellow-500/50 active:scale-90
                       transition-all duration-200"
          >
            <Star size={20} className="text-yellow-400" />
          </button>

          <button
            onClick={() => onLike(card.id)}
            className="w-14 h-14 rounded-full glass flex items-center justify-center
                       hover:bg-green-500/20 hover:border-green-500/50 active:scale-90
                       transition-all duration-200 shadow-lg"
          >
            <Heart size={24} className="text-green-400" />
          </button>
        </div>
      )}
    </motion.div>
  )
}
