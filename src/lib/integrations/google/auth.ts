import { google } from 'googleapis'
import { getOAuthAccount, decryptToken, upsertOAuthAccount } from '../oauth'

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

export function getGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback'
  )
}

export function getGoogleAuthUrl(state: string): string {
  const oauth2Client = getGoogleOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  })
}

export async function exchangeGoogleCode(code: string) {
  const oauth2Client = getGoogleOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function getValidGoogleToken(userId: string): Promise<string | null> {
  const account = await getOAuthAccount(userId, 'google')
  if (!account) return null

  const accessToken = decryptToken(account.accessToken)

  // Check if token is expired (with 5-minute buffer)
  if (account.expiresAt && new Date(account.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000)) {
    if (!account.refreshToken) return null

    try {
      const oauth2Client = getGoogleOAuth2Client()
      oauth2Client.setCredentials({
        refresh_token: decryptToken(account.refreshToken),
      })

      const { credentials } = await oauth2Client.refreshAccessToken()
      if (!credentials.access_token) return null

      const expiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : undefined

      await upsertOAuthAccount(userId, 'google', {
        providerAccountId: account.providerAccountId,
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || decryptToken(account.refreshToken),
        expiresAt,
        scope: credentials.scope || undefined,
        tokenType: credentials.token_type || undefined,
      })

      return credentials.access_token
    } catch {
      return null
    }
  }

  return accessToken
}
