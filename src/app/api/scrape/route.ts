import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { runScraper, summarizeScrapedItem, rematchUnassignedItems } from '@/lib/scraper/scraper'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const source = searchParams.get('source')

  const where: any = {}
  if (clientId) where.clientId = clientId
  if (source) where.source = source

  const items = await prisma.scrapedItem.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'scrape') {
    const result = await runScraper()
    return NextResponse.json(result)
  }

  if (body.action === 'summarize' && body.itemId) {
    const summary = await summarizeScrapedItem(body.itemId)
    return NextResponse.json({ summary })
  }

  if (body.action === 'rematch') {
    const matched = await rematchUnassignedItems()
    return NextResponse.json({ matched })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
