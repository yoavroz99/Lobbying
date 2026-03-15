import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { syncDriveFolder } from '@/lib/integrations/google/sync'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const { folderId } = body

  if (!folderId) {
    return NextResponse.json({ error: 'Missing folderId' }, { status: 400 })
  }

  try {
    const synced = await syncDriveFolder(folderId, userId)
    return NextResponse.json({ success: true, synced })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'שגיאה בסנכרון תיקייה' },
      { status: 500 }
    )
  }
}
