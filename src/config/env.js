import dotenv from 'dotenv'
dotenv.config()

import { authPlugin } from '../middlewares/auth.js'
import { authRoutes } from '../modules/auth/routes.js'

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret',
  DATABASE_URL: process.env.DATABASE_URL || '',

  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '7d'
}
