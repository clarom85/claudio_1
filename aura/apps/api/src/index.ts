import Fastify from 'fastify'
import { Server } from 'socket.io'
import { createServer } from 'http'
import type { ServerToClientEvents, ClientToServerEvents } from '@aura/shared'

import { corsPlugin } from './plugins/cors'
import { jwtPlugin } from './plugins/jwt'
import { redisPlugin } from './plugins/redis'
import { rateLimitPlugin } from './plugins/rateLimit'
import { swaggerPlugin } from './plugins/swagger'
import { socketPlugin } from './plugins/socket'

import { authRoutes } from './routes/auth'
import { profileRoutes } from './routes/profiles'
import { matchRoutes } from './routes/matches'
import { messageRoutes } from './routes/messages'
import { discoveryRoutes } from './routes/discovery'
import { mediaRoutes } from './routes/media'
import { onboardingRoutes } from './routes/onboarding'
import { paymentRoutes } from './routes/payments'

const PORT = parseInt(process.env.API_PORT || '4000', 10)

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  })

  // HTTP server for Socket.io
  const httpServer = createServer(app.server)

  // Socket.io setup
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: process.env.NEXTAUTH_URL || 'http://localhost:3000', credentials: true },
    transports: ['websocket', 'polling'],
  })

  // Plugins
  await app.register(corsPlugin)
  await app.register(jwtPlugin)
  await app.register(redisPlugin)
  await app.register(rateLimitPlugin)
  await app.register(swaggerPlugin)
  await app.register(socketPlugin, { io })

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(onboardingRoutes, { prefix: '/api/onboarding' })
  await app.register(profileRoutes, { prefix: '/api/profiles' })
  await app.register(discoveryRoutes, { prefix: '/api/discovery' })
  await app.register(matchRoutes, { prefix: '/api/matches' })
  await app.register(messageRoutes, { prefix: '/api/messages' })
  await app.register(mediaRoutes, { prefix: '/api/media' })
  await app.register(paymentRoutes, { prefix: '/api/payments' })

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Error handler
  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error)
    const statusCode = error.statusCode || 500
    reply.status(statusCode).send({
      error: error.name,
      message: error.message,
      statusCode,
    })
  })

  await app.ready()
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AURA API running on http://localhost:${PORT}`)
    console.log(`📡 WebSocket server ready`)
    console.log(`📖 Swagger docs at http://localhost:${PORT}/documentation`)
  })
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
