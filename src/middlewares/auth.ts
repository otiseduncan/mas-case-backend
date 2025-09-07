import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: { sub: string; orgId: string; role: string; email: string }
  }
}

export const authPlugin = fp(async function (fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
      request.authUser = request.user
    } catch (err) {
      return reply.code(401).send({ message: 'Unauthorized' })
    }
  })

  fastify.decorate('requireRole', function (roles: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await fastify.authenticate(request, reply)
        const role = request.authUser?.role
        if (!role || !roles.includes(role)) {
          return reply.code(403).send({ message: 'Forbidden' })
        }
      } catch (err) {
        return reply.code(401).send({ message: 'Unauthorized' })
      }
    }
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
