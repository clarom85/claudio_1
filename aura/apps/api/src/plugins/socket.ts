import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import type { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@aura/shared'
import { prisma } from '@aura/db'
import { analyzeVibeCheck } from '@aura/ai'
import jwt from 'jsonwebtoken'

interface SocketPluginOptions {
  io: Server<ClientToServerEvents, ServerToClientEvents>
}

const socketPlugin: FastifyPluginAsync<SocketPluginOptions> = async (app, { io }) => {
  const onlineUsers = new Map<string, string>() // userId -> socketId

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Unauthorized'))
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string }
      socket.data.userId = payload.sub
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    onlineUsers.set(userId, socket.id)

    // Broadcast online presence
    socket.broadcast.emit('presence:update', { userId, isOnline: true })

    socket.on('match:join', (matchId) => {
      socket.join(`match:${matchId}`)
    })

    socket.on('match:leave', (matchId) => {
      socket.leave(`match:${matchId}`)
    })

    socket.on('message:send', async (payload) => {
      const message = await prisma.message.create({
        data: {
          matchId: payload.matchId,
          senderId: userId,
          type: payload.type,
          content: payload.content,
          mediaUrl: payload.mediaUrl,
          replyToId: payload.replyToId,
        },
      })

      const chatMessage = {
        id: message.id,
        matchId: message.matchId,
        senderId: message.senderId,
        type: message.type,
        content: message.content || undefined,
        mediaUrl: message.mediaUrl || undefined,
        replyToId: message.replyToId || undefined,
        isRead: false,
        createdAt: message.createdAt.toISOString(),
      }

      io.to(`match:${payload.matchId}`).emit('message:new', chatMessage)

      // Trigger vibe check analysis every 10 messages
      const messageCount = await prisma.message.count({ where: { matchId: payload.matchId } })
      if (messageCount % 10 === 0) {
        triggerVibeCheck(payload.matchId, io)
      }
    })

    socket.on('message:read', async ({ matchId, messageId }) => {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() },
      })
      io.to(`match:${matchId}`).emit('message:read', { matchId, messageId })
    })

    socket.on('typing:start', (matchId) => {
      socket.to(`match:${matchId}`).emit('typing:start', { matchId, userId })
    })

    socket.on('typing:stop', (matchId) => {
      socket.to(`match:${matchId}`).emit('typing:stop', { matchId, userId })
    })

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId)
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      })
      socket.broadcast.emit('presence:update', {
        userId,
        isOnline: false,
        lastSeen: new Date().toISOString(),
      })
    })
  })

  app.decorate('io', io)
}

async function triggerVibeCheck(
  matchId: string,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return

  const messages = await prisma.message.findMany({
    where: { matchId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { senderId: true, content: true, sentimentScore: true, createdAt: true },
  })

  const vibeCheck = await analyzeVibeCheck(
    messages
      .filter((m) => m.content)
      .map((m) => ({
        senderId: m.senderId,
        content: m.content!,
        sentimentScore: m.sentimentScore || undefined,
        createdAt: m.createdAt.toISOString(),
      })),
    match.fromUserId,
    match.toUserId
  )

  await prisma.vibeCheck.upsert({
    where: { matchId },
    update: { ...vibeCheck, lastAnalyzedAt: new Date() },
    create: { matchId, ...vibeCheck },
  })

  io.to(`match:${matchId}`).emit('vibe:update', { matchId, vibeCheck })
}

export default fp(socketPlugin)
export { socketPlugin }
