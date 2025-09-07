import pino from 'pino'
import { env } from './env.js'
import { authPlugin } from '../middlewares/auth.js'
import { authRoutes } from '../modules/auth/routes.js'

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
})
