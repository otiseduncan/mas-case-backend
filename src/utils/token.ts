import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'

export function signAccessToken(fastify: FastifyInstance, payload: { sub: string; orgId: string; role: string; email: string }) {
  return fastify.jwt.sign(payload, { expiresIn: env.ACCESS_TOKEN_TTL })
}

export async function issueRefreshToken(userId: string) {
  // generate a random 64-byte token, store sha256
  const token = crypto.randomBytes(48).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_TTL))
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt }
  })
  return token
}

export async function revokeRefreshToken(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { isRevoked: true }
  })
}

export async function rotateRefreshToken(oldToken: string, userId: string) {
  await revokeRefreshToken(oldToken)
  return await issueRefreshToken(userId)
}

export async function verifyRefreshToken(token: string, userId: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const dbToken = await prisma.refreshToken.findFirst({
    where: { tokenHash, userId, isRevoked: false }
  })
  if (!dbToken) return false
  if (dbToken.expiresAt.getTime() < Date.now()) return false
  return true
}

function parseDuration(str: string): number {
  // supports s,m,h,d (e.g., 15m, 7d)
  const match = /^([0-9]+)([smhd])$/.exec(str)
  if (!match) throw new Error('Invalid duration string: ' + str)
  const val = parseInt(match[1], 10)
  const unit = match[2]
  switch (unit) {
    case 's': return val * 1000
    case 'm': return val * 60 * 1000
    case 'h': return val * 60 * 60 * 1000
    case 'd': return val * 24 * 60 * 60 * 1000
    default: throw new Error('Invalid duration unit')
  }
}
