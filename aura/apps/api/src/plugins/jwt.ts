import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

export const jwtPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    const token = auth.slice(7)
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
      ;(req as any).user = payload
    } catch {
      return reply.status(401).send({ error: 'Invalid token' })
    }
  })
})
