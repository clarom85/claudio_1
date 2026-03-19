'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AuraCanvas } from '@/components/aura/AuraCanvas'
import { api } from '@/lib/api'
import type { AuraData } from '@aura/shared'

const ONBOARDING_QUESTIONS = [
  { id: 'describe', question: "Describe yourself in three words." },
  { id: 'friday', question: "What does your perfect Friday evening look like?" },
  { id: 'passion', question: "What's something you could talk about for hours?" },
  { id: 'dealbreaker', question: "What's a non-negotiable for you in a relationship?" },
  { id: 'growth', question: "What's something you've been working on lately — personally or professionally?" },
]

const RELATIONSHIP_GOALS = [
  { value: 'LONG_TERM', label: 'Long-term', emoji: '💍' },
  { value: 'SHORT_TERM', label: 'Short-term', emoji: '✨' },
  { value: 'FRIENDSHIP', label: 'Friendship', emoji: '🤝' },
  { value: 'CASUAL', label: 'Casual', emoji: '🌊' },
  { value: 'MARRIAGE', label: 'Marriage', emoji: '🏡' },
  { value: 'UNSURE', label: "Not sure yet", emoji: '🌱' },
]

const INTERESTS = [
  'Travel', 'Music', 'Art', 'Cooking', 'Fitness', 'Tech', 'Books', 'Movies',
  'Photography', 'Gaming', 'Nature', 'Fashion', 'Coffee', 'Yoga', 'Dance',
  'Writing', 'Philosophy', 'Sports', 'Meditation', 'Food', 'Science', 'Comedy',
]

type Step = 'intro' | 'basics' | 'questions' | 'interests' | 'goal' | 'generating' | 'reveal'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedGoal, setSelectedGoal] = useState('')
  const [generatedAura, setGeneratedAura] = useState<AuraData | null>(null)
  const [basics, setBasics] = useState({ name: '', birthDate: '', gender: '', bio: '' })

  async function generateAura() {
    setStep('generating')
    try {
      const res = await api.post('/api/onboarding/complete', {
        basics,
        answers: ONBOARDING_QUESTIONS.map((q) => ({ question: q.question, answer: answers[q.id] ?? '' })),
        interests: selectedInterests,
        relationshipGoal: selectedGoal,
      })
      setGeneratedAura((res as any).data.auraData)
      setStep('reveal')
    } catch {
      router.push('/discover')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-aura-dark">
      <AnimatePresence mode="wait">

        {/* INTRO */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-sm"
          >
            <div className="relative w-40 h-40 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-2xl opacity-30" />
              <div className="relative w-full h-full rounded-full glass flex items-center justify-center text-6xl">
                ✨
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold gradient-text mb-4">Welcome to AURA</h1>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              We'll ask you a few questions to generate your unique aura — a visual representation of who you are.
            </p>
            <button onClick={() => setStep('basics')} className="btn-primary w-full text-lg py-4">
              Create My Aura
            </button>
          </motion.div>
        )}

        {/* BASICS */}
        {step === 'basics' && (
          <motion.div
            key="basics"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-sm space-y-4"
          >
            <h2 className="font-display text-2xl font-bold mb-6">The basics</h2>
            <input
              className="input-field"
              placeholder="Your name"
              value={basics.name}
              onChange={(e) => setBasics({ ...basics, name: e.target.value })}
            />
            <input
              className="input-field"
              type="date"
              placeholder="Birth date"
              value={basics.birthDate}
              onChange={(e) => setBasics({ ...basics, birthDate: e.target.value })}
            />
            <select
              className="input-field"
              value={basics.gender}
              onChange={(e) => setBasics({ ...basics, gender: e.target.value })}
            >
              <option value="">Your gender</option>
              <option value="MALE">Man</option>
              <option value="FEMALE">Woman</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="A short bio (optional)"
              value={basics.bio}
              onChange={(e) => setBasics({ ...basics, bio: e.target.value })}
            />
            <button
              onClick={() => setStep('questions')}
              disabled={!basics.name || !basics.birthDate || !basics.gender}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* PERSONALITY QUESTIONS */}
        {step === 'questions' && (
          <motion.div
            key={`question-${questionIndex}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-sm"
          >
            {/* Progress */}
            <div className="flex gap-1.5 mb-8">
              {ONBOARDING_QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-500"
                  style={{ background: i <= questionIndex ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
                />
              ))}
            </div>

            <p className="text-white/40 text-sm mb-2">Question {questionIndex + 1} of {ONBOARDING_QUESTIONS.length}</p>
            <h2 className="font-display text-2xl font-bold mb-6 leading-tight">
              {ONBOARDING_QUESTIONS[questionIndex].question}
            </h2>

            <textarea
              className="input-field resize-none mb-4"
              rows={4}
              placeholder="Be honest — this shapes your aura..."
              value={answers[ONBOARDING_QUESTIONS[questionIndex].id] ?? ''}
              onChange={(e) => setAnswers({ ...answers, [ONBOARDING_QUESTIONS[questionIndex].id]: e.target.value })}
            />

            <button
              onClick={() => {
                if (questionIndex < ONBOARDING_QUESTIONS.length - 1) {
                  setQuestionIndex((i) => i + 1)
                } else {
                  setStep('interests')
                }
              }}
              disabled={!answers[ONBOARDING_QUESTIONS[questionIndex].id]?.trim()}
              className="btn-primary w-full"
            >
              {questionIndex < ONBOARDING_QUESTIONS.length - 1 ? 'Next' : 'Continue'}
            </button>
          </motion.div>
        )}

        {/* INTERESTS */}
        {step === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-sm"
          >
            <h2 className="font-display text-2xl font-bold mb-2">Your interests</h2>
            <p className="text-white/40 text-sm mb-6">Pick at least 3</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest)
                return (
                  <button
                    key={interest}
                    onClick={() => setSelectedInterests((prev) =>
                      selected ? prev.filter((i) => i !== interest) : [...prev, interest]
                    )}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selected
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25'
                        : 'glass hover:bg-white/10'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setStep('goal')}
              disabled={selectedInterests.length < 3}
              className="btn-primary w-full"
            >
              Continue ({selectedInterests.length} selected)
            </button>
          </motion.div>
        )}

        {/* RELATIONSHIP GOAL */}
        {step === 'goal' && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-sm"
          >
            <h2 className="font-display text-2xl font-bold mb-2">What are you looking for?</h2>
            <p className="text-white/40 text-sm mb-6">Be honest — it helps find better matches</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {RELATIONSHIP_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setSelectedGoal(goal.value)}
                  className={`p-4 rounded-2xl text-left transition-all duration-200 ${
                    selectedGoal === goal.value
                      ? 'bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border border-violet-500/50'
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{goal.emoji}</div>
                  <div className="font-medium text-sm">{goal.label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={generateAura}
              disabled={!selectedGoal}
              className="btn-primary w-full text-lg py-4"
            >
              Generate My Aura ✨
            </button>
          </motion.div>
        )}

        {/* GENERATING */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative w-48 h-48 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-3xl opacity-40 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-xl opacity-20 animate-spin-slow" />
              <div className="relative w-full h-full rounded-full glass flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold gradient-text mb-2">Crafting your aura...</h2>
            <p className="text-white/40">Our AI is analyzing your personality</p>
          </motion.div>
        )}

        {/* AURA REVEAL */}
        {step === 'reveal' && generatedAura && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <p className="text-white/40 text-sm mb-4 uppercase tracking-widest">Your Aura</p>
            <div className="flex justify-center mb-6">
              <AuraCanvas auraData={generatedAura} size={240} className="animate-float" />
            </div>

            <h2 className="font-display text-3xl font-bold gradient-text mb-2">
              {basics.name}'s Aura
            </h2>

            {/* Trait bars */}
            <div className="space-y-2 mb-8 text-left">
              {generatedAura.traits.map((trait) => (
                <div key={trait.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">{trait.name}</span>
                    <span style={{ color: trait.color }}>{Math.round(trait.value * 100)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trait.value * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ background: trait.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/discover')}
              className="btn-primary w-full text-lg py-4"
            >
              Start Discovering ✨
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
