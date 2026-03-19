'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Mic, Image as ImageIcon, ArrowLeft, MoreVertical } from 'lucide-react'
import { AuraCanvas } from '@/components/aura/AuraCanvas'
import { useSocket } from '@/hooks/useSocket'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { ChatMessage, VibeCheckResult } from '@aura/shared'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function MessagePage() {
  const { id: matchId } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const socket = useSocket()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [vibeCheck, setVibeCheck] = useState<VibeCheckResult | null>(null)
  const [showVibeCheck, setShowVibeCheck] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Load match & messages
  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => api.get(`/api/matches/${matchId}`).then((r: any) => r.data),
  })

  const { data: history } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => api.get(`/api/messages/${matchId}`).then((r: any) => r.data),
    onSuccess: (data: ChatMessage[]) => setMessages(data),
  } as any)

  // Socket setup
  useEffect(() => {
    if (!socket || !matchId) return

    socket.emit('match:join', matchId)

    socket.on('message:new', (msg) => {
      if (msg.matchId === matchId) {
        setMessages((prev) => [...prev, msg])
        // Mark as read
        socket.emit('message:read', { matchId, messageId: msg.id })
      }
    })

    socket.on('typing:start', ({ matchId: mid }) => {
      if (mid === matchId) setPartnerTyping(true)
    })

    socket.on('typing:stop', ({ matchId: mid }) => {
      if (mid === matchId) setPartnerTyping(false)
    })

    socket.on('vibe:update', ({ matchId: mid, vibeCheck: vc }) => {
      if (mid === matchId) setVibeCheck(vc)
    })

    return () => {
      socket.emit('match:leave', matchId)
      socket.off('message:new')
      socket.off('typing:start')
      socket.off('typing:stop')
      socket.off('vibe:update')
    }
  }, [socket, matchId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)

    if (!isTyping) {
      setIsTyping(true)
      socket?.emit('typing:start', matchId)
    }

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket?.emit('typing:stop', matchId)
    }, 1500)
  }

  function sendMessage() {
    if (!input.trim() || !socket) return

    socket.emit('message:send', {
      matchId,
      type: 'TEXT',
      content: input.trim(),
    })

    setInput('')
    setIsTyping(false)
    socket.emit('typing:stop', matchId)
  }

  async function loadAiSuggestions() {
    const res = await api.post(`/api/messages/${matchId}/suggestions`, {})
    setAiSuggestions((res as any).data ?? [])
  }

  const vibeColor = vibeCheck
    ? vibeCheck.trend === 'rising' ? '#10b981'
    : vibeCheck.trend === 'declining' ? '#ef4444' : '#f59e0b'
    : '#6366f1'

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 glass border-b border-white/10">
        <Link href="/matches" className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </Link>

        {match?.auraData && (
          <div className="relative">
            <AuraCanvas auraData={match.auraData} size={44} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-aura-dark" />
          </div>
        )}

        <div className="flex-1">
          <h2 className="font-semibold">{match?.name ?? '...'}</h2>
          <p className="text-xs text-white/40">
            {partnerTyping ? (
              <span className="text-violet-400 animate-pulse">typing...</span>
            ) : (
              'Online'
            )}
          </p>
        </div>

        {/* Vibe check indicator */}
        {vibeCheck && (
          <button
            onClick={() => setShowVibeCheck(!showVibeCheck)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs"
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: vibeColor }} />
            <span>Vibe {vibeCheck.score}</span>
          </button>
        )}

        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Vibe check panel */}
      <AnimatePresence>
        {showVibeCheck && vibeCheck && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass border-b border-white/10 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-violet-400" />
                <span className="font-semibold text-sm">Vibe Check</span>
                <span className="ml-auto text-xs text-white/40">
                  {vibeCheck.trend === 'rising' ? '📈 Rising' :
                   vibeCheck.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                </span>
              </div>

              {/* Score bar */}
              <div className="h-1.5 rounded-full bg-white/10 mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${vibeCheck.score}%`, background: vibeColor }}
                />
              </div>

              <div className="space-y-1.5 mb-3">
                {vibeCheck.insights.map((insight, i) => (
                  <p key={i} className="text-xs text-white/60">{insight}</p>
                ))}
              </div>

              <div>
                <p className="text-xs text-white/40 mb-2">Try talking about:</p>
                <div className="flex flex-wrap gap-1.5">
                  {vibeCheck.suggestedTopics.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(topic)}
                      className="px-2.5 py-1 rounded-full glass text-xs hover:bg-violet-500/20 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.senderId === user?.id
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isOwn
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-br-sm'
                    : 'glass rounded-bl-sm'
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${isOwn ? 'text-white/50' : 'text-white/30'} text-right`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </div>
              </div>
            </motion.div>
          )
        })}

        {partnerTyping && (
          <div className="flex justify-start">
            <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AI suggestions */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-3 flex gap-2 overflow-x-auto">
              {aiSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); setAiSuggestions([]) }}
                  className="flex-shrink-0 max-w-[200px] text-left px-3 py-2 rounded-xl glass text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 glass border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={loadAiSuggestions}
            className="p-2.5 rounded-xl glass hover:bg-violet-500/20 transition-colors"
            title="AI suggestions"
          >
            <Sparkles size={18} className="text-violet-400" />
          </button>

          <button className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors">
            <ImageIcon size={18} className="text-white/60" />
          </button>

          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Message..."
            className="flex-1 input-field py-2.5"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600
                       disabled:opacity-30 hover:opacity-90 active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
