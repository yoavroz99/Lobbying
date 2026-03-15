import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getOAuthAccount } from '@/lib/integrations/oauth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const [microsoft, google] = await Promise.all([
    getOAuthAccount(userId, 'microsoft'),
    getOAuthAccount(userId, 'google'),
  ])

  return NextResponse.json({
    microsoft: {
      connected: !!microsoft,
      connectedAt: microsoft?.createdAt || null,
    },
    google: {
      connected: !!google,
      connectedAt: google?.createdAt || null,
    },
  })
}
