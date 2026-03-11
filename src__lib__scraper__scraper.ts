import * as cheerio from 'cheerio'
import { prisma } from '@/lib/db'
import { SCRAPING_SOURCES, KNESSET_API, type ScrapingSource } from './sources'
import { generateCompletion } from '@/lib/ai/openai'

interface ScrapedResult {
  source: string
  sourceUrl: string
  title: string
  content: string
  date?: string
  committee?: string
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LobbyistPro/1.0)',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return null
    return response.text()
  } catch {
    console.error(`Failed to fetch ${url}`)
    return null
  }
}

async function scrapeHtmlSource(source: ScrapingSource): Promise<ScrapedResult[]> {
  const html = await fetchPage(source.baseUrl)
  if (!html) return []

  const $ = cheerio.load(html)
  const results: ScrapedResult[] = []

  $(source.selectors.itemList).each((_, el) => {
    const $el = $(el)
    const title = $el.find(source.selectors.title).text().trim()
    const content = $el.find(source.selectors.content).text().trim()
    const date = $el.find(source.selectors.date).text().trim()
    const link = $el.find(source.selectors.link).attr('href') || ''

    if (title) {
      results.push({
        source: source.type,
        sourceUrl: link.startsWith('http') ? link : `${new URL(source.baseUrl).origin}${link}`,
        title,
        content: content || title,
        date: date || undefined,
        committee: source.type === 'knesset_committee' ? source.nameHe : undefined,
      })
    }
  })

  return results
}

async function scrapeKnessetApi(): Promise<ScrapedResult[]> {
  const results: ScrapedResult[] = []

  // Fetch committee sessions from OData API
  try {
    const response = await fetch(
      `${KNESSET_API.base}${KNESSET_API.endpoints.committeeSessions}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (response.ok) {
      const data = await response.json()
      const sessions = data?.d?.results || data?.value || []
      for (const session of sessions.slice(0, 30)) {
        results.push({
          source: 'knesset_committee',
          sourceUrl: `https://main.knesset.gov.il/Activity/committees/Pages/CommitteeSession.aspx?ItemID=${session.CommitteeSessionID || ''}`,
          title: session.Name || session.Topic || 'ישיבת ועדה',
          content: session.Note || session.Topic || '',
          date: session.StartDate || undefined,
          committee: session.CommitteeName || undefined,
        })
      }
    }
  } catch {
    console.error('Failed to fetch Knesset API committee sessions')
  }

  // Fetch bills
  try {
    const response = await fetch(
      `${KNESSET_API.base}${KNESSET_API.endpoints.bills}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (response.ok) {
      const data = await response.json()
      const bills = data?.d?.results || data?.value || []
      for (const bill of bills.slice(0, 30)) {
        results.push({
          source: 'legislation',
          sourceUrl: `https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx?t=LawsAll&lawitemid=${bill.BillID || ''}`,
          title: bill.Name || 'הצעת חוק',
          content: bill.SummaryLaw || bill.Name || '',
          date: bill.LastUpdatedDate || undefined,
        })
      }
    }
  } catch {
    console.error('Failed to fetch Knesset API bills')
  }

  return results
}

async function matchToClients(item: ScrapedResult): Promise<string | null> {
  const clients = await prisma.client.findMany({
    where: { status: 'active', keywords: { not: null } },
    select: { id: true, keywords: true, name: true },
  })

  for (const client of clients) {
    if (!client.keywords) continue
    const keywords = client.keywords.split(',').map((k) => k.trim().toLowerCase())
    const text = `${item.title} ${item.content}`.toLowerCase()
    if (keywords.some((kw) => kw.length > 0 && text.includes(kw))) {
      return client.id
    }
  }

  return null
}

export async function runScraper(): Promise<{ added: number; errors: number }> {
  let added = 0
  let errors = 0

  // Scrape HTML sources
  for (const source of SCRAPING_SOURCES) {
    try {
      const results = await scrapeHtmlSource(source)
      for (const item of results) {
        const existing = await prisma.scrapedItem.findFirst({
          where: { title: item.title, source: item.source },
        })
        if (existing) continue

        const clientId = await matchToClients(item)
        await prisma.scrapedItem.create({
          data: {
            source: item.source,
            sourceUrl: item.sourceUrl,
            title: item.title,
            content: item.content,
            date: item.date ? new Date(item.date) : null,
            committee: item.committee,
            clientId,
          },
        })
        added++
      }
    } catch (err) {
      console.error(`Error scraping ${source.id}:`, err)
      errors++
    }
  }

  // Scrape Knesset API
  try {
    const apiResults = await scrapeKnessetApi()
    for (const item of apiResults) {
      const existing = await prisma.scrapedItem.findFirst({
        where: { title: item.title, source: item.source },
      })
      if (existing) continue

      const clientId = await matchToClients(item)
      await prisma.scrapedItem.create({
        data: {
          source: item.source,
          sourceUrl: item.sourceUrl,
          title: item.title,
          content: item.content,
          date: item.date ? new Date(item.date) : null,
          committee: item.committee,
          clientId,
        },
      })
      added++
    }
  } catch (err) {
    console.error('Error scraping Knesset API:', err)
    errors++
  }

  return { added, errors }
}

export async function summarizeScrapedItem(itemId: string): Promise<string> {
  const item = await prisma.scrapedItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Item not found')

  const summary = await generateCompletion(
    'אתה עוזר מקצועי. סכם את התוכן הבא בצורה תמציתית בעברית.',
    `כותרת: ${item.title}\n\nתוכן: ${item.content}`
  )

  await prisma.scrapedItem.update({
    where: { id: itemId },
    data: { summary },
  })

  return summary
}
