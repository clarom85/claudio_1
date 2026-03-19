import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { createClient } from 'redis'

export const redisPlugin: FastifyPluginAsync = fp(async (app) => {
  const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
  await client.connect()

  app.decorate('redis', client)
  app.addHook('onClose', async () => { await client.disconnect() })
})
