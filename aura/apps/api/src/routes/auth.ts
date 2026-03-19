import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@aura/db'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

function signTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ sub: userId, email }, process.env.JWT_SECRET!, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '30d' })
  return { accessToken, refreshToken, expiresIn: 900 }
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  // Register
  app.post('/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return reply.status(409).send({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(body.password, 12)
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash },
    })

    // Create empty profile stub
    await prisma.profile.create({
      data: {
        userId: user.id,
        name: body.name,
        birthDate: new Date('1990-01-01'), // placeholder until onboarding
        gender: 'OTHER',
        sexualOrientation: 'OTHER',
        relationshipGoal: 'UNSURE',
      },
    })

    const tokens = signTokens(user.id, user.email)

    // Store refresh token in Redis
    await (app as any).redis.set(`refresh:${user.id}`, tokens.refreshToken, 'EX', 60 * 60 * 24 * 30)

    return reply.status(201).send({ data: tokens })
  })

  // Login
  app.post('/login', async (req, reply) => {
    const body = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' })

    if (user.isBanned) return reply.status(403).send({ error: 'Account suspended' })

    const tokens = signTokens(user.id, user.email)
    await (app as any).redis.set(`refresh:${user.id}`, tokens.refreshToken, 'EX', 60 * 60 * 24 * 30)

    return { data: tokens }
  })

  // Refresh token
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body)

    let payload: any
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET!)
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' })
    }

    const stored = await (app as any).redis.get(`refresh:${payload.sub}`)
    if (stored !== refreshToken) {
      return reply.status(401).send({ error: 'Token revoked' })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return reply.status(401).send({ error: 'User not found' })

    const tokens = signTokens(user.id, user.email)
    await (app as any).redis.set(`refresh:${user.id}`, tokens.refreshToken, 'EX', 60 * 60 * 24 * 30)

    return { data: tokens }
  })

  // Logout
  app.post('/logout', {
    preHandler: [(app as any).authenticate],
  }, async (req, reply) => {
    const userId = (req as any).user.sub
    await (app as any).redis.del(`refresh:${userId}`)
    return { data: { success: true } }
  })
}
