import { NextRequest, NextResponse } from 'next/server'
import { exchangeMicrosoftCode } from '@/lib/integrations/microsoft/auth'
import { getMicrosoftUserInfo } from '@/lib/integrations/microsoft/graph'
import { upsertOAuthAccount } from '@/lib/integrations/oauth'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/profile?error=microsoft_denied', req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/profile?error=microsoft_missing_params', req.url))
  }

  // Validate state
  const storedCsrf = req.cookies.get('oauth_state')?.value
  let stateData: { userId: string; csrf: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(new URL('/profile?error=microsoft_invalid_state', req.url))
  }

  if (!storedCsrf || stateData.csrf !== storedCsrf) {
    return NextResponse.redirect(new URL('/profile?error=microsoft_csrf_mismatch', req.url))
  }

  try {
    const tokens = await exchangeMicrosoftCode(code)
    const userInfo = await getMicrosoftUserInfo(tokens.access_token)

    await upsertOAuthAccount(stateData.userId, 'microsoft', {
      providerAccountId: userInfo.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      tokenType: tokens.token_type,
    })

    const response = NextResponse.redirect(new URL('/profile?connected=microsoft', req.url))
    response.cookies.delete('oauth_state')
    return response
  } catch (err) {
    console.error('Microsoft OAuth callback error:', err)
    return NextResponse.redirect(new URL('/profile?error=microsoft_exchange_failed', req.url))
  }
}
