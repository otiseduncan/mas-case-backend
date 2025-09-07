import { PrismaClient } from '@prisma/client'
import { authPlugin } from '../middlewares/auth.js'
import { authRoutes } from '../modules/auth/routes.js'

export const prisma = new PrismaClient()
