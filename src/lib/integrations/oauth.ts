import crypto from 'crypto'
import { prisma } from '@/lib/db'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || 'lobby-pro-dev-secret-key'
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptToken(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
}

export function decryptToken(encrypted: string): string {
  const key = getEncryptionKey()
  const parts = encrypted.split(':')
  if (parts.length !== 3) return encrypted // not encrypted, return as-is
  const iv = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  let decrypted = decipher.update(parts[2], 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function getOAuthAccount(userId: string, provider: string) {
  return prisma.oAuthAccount.findUnique({
    where: { userId_provider: { userId, provider } },
  })
}

export async function upsertOAuthAccount(
  userId: string,
  provider: string,
  data: {
    providerAccountId: string
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
    tokenType?: string
  }
) {
  return prisma.oAuthAccount.upsert({
    where: { userId_provider: { userId, provider } },
    update: {
      accessToken: encryptToken(data.accessToken),
      refreshToken: data.refreshToken ? encryptToken(data.refreshToken) : undefined,
      expiresAt: data.expiresAt,
      scope: data.scope,
      tokenType: data.tokenType,
    },
    create: {
      userId,
      provider,
      providerAccountId: data.providerAccountId,
      accessToken: encryptToken(data.accessToken),
      refreshToken: data.refreshToken ? encryptToken(data.refreshToken) : null,
      expiresAt: data.expiresAt,
      scope: data.scope,
      tokenType: data.tokenType,
    },
  })
}

export async function removeOAuthAccount(userId: string, provider: string) {
  return prisma.oAuthAccount.delete({
    where: { userId_provider: { userId, provider } },
  }).catch(() => null)
}
