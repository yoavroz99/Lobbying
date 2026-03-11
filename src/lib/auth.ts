import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { cookies, headers } from 'next/headers'
import { authOptions, AUTH_SECRET } from '@/lib/auth-options'

export async function getSession() {
  // Try getServerSession first
  const session = await getServerSession(authOptions)
  if (session) return session

  // Fallback: read JWT token directly from cookie using the same secret
  try {
    const cookieStore = cookies()
    const headersList = headers()

    const req = {
      headers: Object.fromEntries(headersList.entries()),
      cookies: Object.fromEntries(
        cookieStore.getAll().map((c) => [c.name, c.value])
      ),
    }

    const token = await getToken({
      req: req as any,
      secret: AUTH_SECRET,
    })

    if (token) {
      return {
        user: {
          id: token.id as string,
          name: token.name,
          email: token.email,
          role: token.role as string,
        },
        expires: new Date(((token.exp as number) || 0) * 1000).toISOString(),
      }
    }
  } catch (e) {
    console.error('getToken fallback error:', e)
  }

  return null
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}
