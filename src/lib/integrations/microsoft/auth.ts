import { getOAuthAccount, decryptToken, upsertOAuthAccount } from '../oauth'

const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'

const SCOPES = ['openid', 'email', 'profile', 'Mail.Send', 'Mail.ReadWrite', 'offline_access']

export function getMicrosoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/integrations/microsoft/callback',
    scope: SCOPES.join(' '),
    state,
    response_mode: 'query',
    prompt: 'consent',
  })
  return `${MICROSOFT_AUTH_URL}?${params.toString()}`
}

export async function exchangeMicrosoftCode(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
  id_token?: string
  scope: string
  token_type: string
}> {
  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
      code,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/integrations/microsoft/callback',
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Microsoft token exchange failed: ${error}`)
  }

  return res.json()
}

export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
}> {
  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: SCOPES.join(' '),
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Microsoft token refresh failed: ${error}`)
  }

  return res.json()
}

export async function getValidMicrosoftToken(userId: string): Promise<string | null> {
  const account = await getOAuthAccount(userId, 'microsoft')
  if (!account) return null

  const accessToken = decryptToken(account.accessToken)

  // Check if token is expired (with 5-minute buffer)
  if (account.expiresAt && new Date(account.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
    if (!account.refreshToken) return null

    try {
      const refreshToken = decryptToken(account.refreshToken)
      const tokens = await refreshMicrosoftToken(refreshToken)
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      await upsertOAuthAccount(userId, 'microsoft', {
        providerAccountId: account.providerAccountId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken,
        expiresAt,
        scope: tokens.scope,
        tokenType: tokens.token_type,
      })

      return tokens.access_token
    } catch {
      return null
    }
  }

  return accessToken
}
