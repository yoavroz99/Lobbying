import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateDigestForClient } from '@/lib/integrations/microsoft/digest'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { clientId, dateFrom, dateTo } = body

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  }

  try {
    const digest = await generateDigestForClient(clientId, {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    })

    return NextResponse.json(digest)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'שגיאה ביצירת תצוגה מקדימה' },
      { status: 500 }
    )
  }
}
