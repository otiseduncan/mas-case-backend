import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { comparePassword, hashPassword } from '../../utils/password.js'

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users', { preHandler: fastify.requireRole(['admin']) }, async (req, reply) => {
    const user = req.authUser!
    const users = await prisma.user.findMany({
      where: { orgId: user.orgId },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true }
    })
    return reply.send(users)
  })

  const patchBody = z.object({
    role: z.enum(['admin','manager','tech']).optional(),
    isActive: z.boolean().optional()
  })

  fastify.patch('/users/:id', { preHandler: fastify.requireRole(['admin']) }, async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params)
    const body = patchBody.parse(req.body)
    const auth = req.authUser!
    const target = await prisma.user.findFirst({ where: { id: params.id, orgId: auth.orgId } })
    if (!target) return reply.code(404).send({ message: 'User not found' })
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: body
    })
    return reply.send({ id: updated.id, role: updated.role, isActive: updated.isActive })
  })
}
