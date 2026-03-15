import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMicrosoftAuthUrl } from '@/lib/integrations/microsoft/auth'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const csrfToken = crypto.randomBytes(16).toString('hex')
  const state = Buffer.from(JSON.stringify({ userId, csrf: csrfToken })).toString('base64url')

  const authUrl = getMicrosoftAuthUrl(state)

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('oauth_state', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
