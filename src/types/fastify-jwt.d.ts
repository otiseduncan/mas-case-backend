// eslint-disable-next-line @typescript-eslint/no-unused-vars
import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; orgId: string; role: string; email: string } // what is encoded in the token
    user: { sub: string; orgId: string; role: string; email: string }    // what you get after verify()
  }
}
