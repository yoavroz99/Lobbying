import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateDigestForClient, sendDigest } from '@/lib/integrations/microsoft/digest'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const { clientId, action, recipients, subject, dateFrom, dateTo } = body

  if (!clientId || !action || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (action !== 'send' && action !== 'draft') {
    return NextResponse.json({ error: 'Action must be "send" or "draft"' }, { status: 400 })
  }

  try {
    // Generate digest content
    const digest = await generateDigestForClient(clientId, {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    })

    const finalSubject = subject || digest.subject

    // Send or create draft via Outlook
    const result = await sendDigest(userId, clientId, finalSubject, digest.htmlBody, recipients, action)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'שגיאה ביצירת הדייג׳סט' },
      { status: 500 }
    )
  }
}
