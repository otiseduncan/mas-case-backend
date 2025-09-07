import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../../config/prisma.js'
import { comparePassword, hashPassword } from '../../utils/password.js'
import { signAccessToken, issueRefreshToken, verifyRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../../utils/token.js'

export async function authRoutes(fastify: FastifyInstance) {
  const loginBody = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  fastify.post('/auth/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } }
  }, async (req, reply) => {
    const body = loginBody.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !user.isActive) {
      return reply.code(401).send({ message: 'Invalid credentials' })
    }
    const ok = await comparePassword(body.password, user.passwordHash)
    if (!ok) {
      return reply.code(401).send({ message: 'Invalid credentials' })
    }
    const accessToken = signAccessToken(fastify, { sub: user.id, orgId: user.orgId, role: user.role, email: user.email })
    const refreshToken = await issueRefreshToken(user.id)
    return reply.send({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId } })
  })

  const refreshSchema = z.object({
    refreshToken: z.string().min(10),
  })
  fastify.post('/auth/refresh', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body)
    try {
      const authUser = req.user // not verified here
      // Decode not needed; we validate against DB by user id in token after verifying existing access?
      // Instead, require client to send current user id
      const userId = (req.headers['x-user-id'] as string) || ''
      if (!userId) return reply.code(400).send({ message: 'Missing x-user-id header' })
      const ok = await verifyRefreshToken(refreshToken, userId)
      if (!ok) return reply.code(401).send({ message: 'Invalid refresh token' })
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return reply.code(401).send({ message: 'Invalid user' })
      const accessToken = signAccessToken(fastify, { sub: user.id, orgId: user.orgId, role: user.role, email: user.email })
      const newRefreshToken = await rotateRefreshToken(refreshToken, user.id)
      return reply.send({ accessToken, refreshToken: newRefreshToken })
    } catch (e) {
      return reply.code(401).send({ message: 'Invalid refresh token' })
    }
  })

  const signupBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin','manager','tech']).default('tech'),
    orgId: z.string(),
    name: z.string().optional()
  })

  // Admin-only signup endpoint to create users
  fastify.post('/auth/signup', { preHandler: fastify.requireRole(['admin']) }, async (req, reply) => {
    const body = signupBody.parse(req.body)
    const pwHash = await hashPassword(body.password)
    try {
      const created = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash: pwHash,
          role: body.role,
          orgId: body.orgId,
          name: body.name
        },
        select: { id: true, email: true, role: true, orgId: true }
      })
      return reply.code(201).send(created)
    } catch (e: any) {
      if (e.code === 'P2002') {
        return reply.code(409).send({ message: 'Email already exists' })
      }
      throw e
    }
  })

  // Logout: revoke a refresh token
  fastify.post('/auth/logout', async (req, reply) => {
    const body = z.object({ refreshToken: z.string().min(10) }).parse(req.body)
    await revokeRefreshToken(body.refreshToken)
    return reply.send({ ok: true })
  })
}
