import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleCode } from '@/lib/integrations/google/auth'
import { getGoogleUserInfo } from '@/lib/integrations/google/drive'
import { upsertOAuthAccount } from '@/lib/integrations/oauth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/profile?error=google_denied', req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/profile?error=google_missing_params', req.url))
  }

  const storedCsrf = req.cookies.get('oauth_state')?.value
  let stateData: { userId: string; csrf: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(new URL('/profile?error=google_invalid_state', req.url))
  }

  if (!storedCsrf || stateData.csrf !== storedCsrf) {
    return NextResponse.redirect(new URL('/profile?error=google_csrf_mismatch', req.url))
  }

  try {
    const tokens = await exchangeGoogleCode(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/profile?error=google_no_token', req.url))
    }

    const userInfo = await getGoogleUserInfo(tokens.access_token)

    await upsertOAuthAccount(stateData.userId, 'google', {
      providerAccountId: userInfo.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scope: tokens.scope || undefined,
      tokenType: tokens.token_type || undefined,
    })

    const response = NextResponse.redirect(new URL('/profile?connected=google', req.url))
    response.cookies.delete('oauth_state')
    return response
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(new URL('/profile?error=google_exchange_failed', req.url))
  }
}
