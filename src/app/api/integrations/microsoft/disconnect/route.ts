import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { removeOAuthAccount } from '@/lib/integrations/oauth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  await removeOAuthAccount(userId, 'microsoft')

  return NextResponse.json({ success: true })
}
