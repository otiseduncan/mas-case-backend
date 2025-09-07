import { authPlugin } from './auth.js'
import { authRoutes } from '../modules/auth/routes.js'
import fp from 'fastify-plugin'

export const authPlugin = fp(async (fastify) => {
  // ...auth logic here...
})
