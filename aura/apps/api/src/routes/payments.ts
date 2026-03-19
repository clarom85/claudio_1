import type { FastifyPluginAsync } from 'fastify'
import Stripe from 'stripe'
import { prisma } from '@aura/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

// Pricing — update with real Stripe price IDs
export const PLANS = {
  gold: {
    name: 'Gold',
    monthlyPriceId: process.env.STRIPE_GOLD_MONTHLY_ID!,
    yearlyPriceId: process.env.STRIPE_GOLD_YEARLY_ID!,
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    features: [
      'Unlimited likes',
      '5 Super Likes per day',
      'See who liked you',
      '1 Rewind per day',
      '3 AI Suggestions per day',
      'Priority in discovery',
      'Read receipts',
    ],
    color: '#f59e0b',
  },
  platinum: {
    name: 'Platinum',
    monthlyPriceId: process.env.STRIPE_PLATINUM_MONTHLY_ID!,
    yearlyPriceId: process.env.STRIPE_PLATINUM_YEARLY_ID!,
    monthlyPrice: 19.99,
    yearlyPrice: 159.99,
    features: [
      'Everything in Gold',
      '10 Super Likes per day',
      '3 Rewinds per day',
      'Unlimited AI Suggestions',
      'AI Ghostwriter (reply assistant)',
      '1 Boost per month',
      'No ads',
      'Exclusive Platinum aura effects',
      'Advanced compatibility insights',
    ],
    color: '#8b5cf6',
  },
}

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  const auth = [(app as any).authenticate]

  // GET /api/payments/plans — list available plans
  app.get('/plans', async () => {
    return { data: PLANS }
  })

  // POST /api/payments/checkout — create Stripe Checkout session
  app.post('/checkout', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const { plan, billing } = req.body as { plan: 'gold' | 'platinum'; billing: 'monthly' | 'yearly' }

    if (!PLANS[plan]) return reply.status(400).send({ error: 'Invalid plan' })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const priceId = billing === 'yearly' ? PLANS[plan].yearlyPriceId : PLANS[plan].monthlyPriceId

    // Get or create Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      })
      stripeCustomerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/premium`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
    })

    return { data: { url: session.url, sessionId: session.id } }
  })

  // POST /api/payments/portal — customer portal for managing subscription
  app.post('/portal', { preHandler: auth }, async (req, reply) => {
    const userId = (req as any).user.sub
    const sub = await prisma.subscription.findUnique({ where: { userId } })
    if (!sub?.stripeCustomerId) return reply.status(400).send({ error: 'No subscription found' })

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/profile`,
    })

    return { data: { url: session.url } }
  })

  // POST /api/payments/webhook — Stripe webhook
  app.post('/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch {
      return reply.status(400).send({ error: 'Invalid webhook signature' })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, plan } = session.metadata!
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await prisma.$transaction([
          prisma.subscription.upsert({
            where: { userId },
            update: {
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubId: subscription.id,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtEnd: false,
            },
            create: {
              userId,
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubId: subscription.id,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          }),
          prisma.user.update({ where: { id: userId }, data: { isPremium: true } }),
        ])
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata.userId
        if (!userId) break

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: sub.metadata.plan,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtEnd: sub.cancel_at_period_end,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata.userId
        if (!userId) break

        await prisma.$transaction([
          prisma.subscription.delete({ where: { userId } }),
          prisma.user.update({ where: { id: userId }, data: { isPremium: false } }),
        ])
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const userId = sub.metadata.userId
        if (userId) {
          // Could send email notification here
          await prisma.user.update({ where: { id: userId }, data: { isPremium: false } })
        }
        break
      }
    }

    return { received: true }
  })

  // GET /api/payments/status — current subscription status
  app.get('/status', { preHandler: auth }, async (req) => {
    const userId = (req as any).user.sub
    const sub = await prisma.subscription.findUnique({ where: { userId } })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } })

    return {
      data: {
        isPremium: user?.isPremium ?? false,
        subscription: sub ? {
          plan: sub.plan,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtEnd: sub.cancelAtEnd,
        } : null,
      },
    }
  })
}
