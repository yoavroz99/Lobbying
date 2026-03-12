import * as cheerio from 'cheerio'
import { prisma } from '@/lib/db'
import { SCRAPING_SOURCES, KNESSET_API, NEWS_SOURCES, type ScrapingSource } from './sources'
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.5',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) {
      console.error(`HTTP ${response.status} for ${url}`)
      return null
    }
    return response.text()
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err instanceof Error ? err.message : err)
    return null
  }
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LobbyistPro/1.0)',
        'Accept': 'application/json',
        'Accept-Language': 'he-IL,he;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) {
      console.error(`HTTP ${response.status} for JSON ${url}`)
      return null
    }
    return response.json()
  } catch (err) {
    console.error(`Failed to fetch JSON ${url}:`, err instanceof Error ? err.message : err)
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

    if (title && title.length > 3) {
      results.push({
        source: source.type,
        sourceUrl: link.startsWith('http') ? link : `${new URL(source.baseUrl).origin}${link}`,
        title: title.slice(0, 500),
        content: (content || title).slice(0, 2000),
        date: date || undefined,
        committee: source.type === 'knesset_committee' ? source.nameHe : undefined,
      })
    }
  })

  return results
}

// ─── Knesset OData API ──────────────────────────────────────────────────────

async function scrapeKnessetCommitteeSessions(): Promise<ScrapedResult[]> {
  const results: ScrapedResult[] = []
  const url = `${KNESSET_API.base}${KNESSET_API.endpoints.committeeSessions}`
  console.log(`[Knesset API] Fetching committee sessions: ${url}`)

  const data = await fetchJson(url)
  if (!data) return results

  // OData v2 uses d.results, v4 uses value
  const sessions: any[] = data?.d?.results || data?.d || data?.value || []
  if (!Array.isArray(sessions)) {
    console.log('[Knesset API] Unexpected sessions format:', typeof sessions)
    return results
  }

  console.log(`[Knesset API] Got ${sessions.length} committee sessions`)

  for (const session of sessions.slice(0, 40)) {
    const title = session.Name || session.Topic || session.SessionTopic || ''
    if (!title || title.length < 3) continue

    // Parse OData date format /Date(timestamp)/
    let dateStr: string | undefined
    const rawDate = session.StartDate || session.Date
    if (rawDate) {
      const match = String(rawDate).match(/\/Date\((\d+)\)\//)
      if (match) {
        dateStr = new Date(parseInt(match[1])).toISOString()
      } else {
        dateStr = rawDate
      }
    }

    results.push({
      source: 'knesset_committee',
      sourceUrl: session.CommitteeSessionID
        ? `https://main.knesset.gov.il/Activity/committees/Pages/CommitteeSession.aspx?ItemID=${session.CommitteeSessionID}`
        : 'https://main.knesset.gov.il/Activity/committees/Pages/AllCommitteeSchedule.aspx',
      title,
      content: [session.Note, session.Topic, session.SessionTopic].filter(Boolean).join(' | ') || title,
      date: dateStr,
      committee: session.CommitteeName || session.Committee?.Name || undefined,
    })
  }

  return results
}

async function scrapeKnessetBills(): Promise<ScrapedResult[]> {
  const results: ScrapedResult[] = []
  const url = `${KNESSET_API.base}${KNESSET_API.endpoints.bills}`
  console.log(`[Knesset API] Fetching bills: ${url}`)

  const data = await fetchJson(url)
  if (!data) return results

  const bills: any[] = data?.d?.results || data?.d || data?.value || []
  if (!Array.isArray(bills)) {
    console.log('[Knesset API] Unexpected bills format:', typeof bills)
    return results
  }

  console.log(`[Knesset API] Got ${bills.length} bills`)

  for (const bill of bills.slice(0, 40)) {
    const title = bill.Name || bill.KNS_BillName || ''
    if (!title || title.length < 3) continue

    let dateStr: string | undefined
    const rawDate = bill.LastUpdatedDate || bill.StatusDate
    if (rawDate) {
      const match = String(rawDate).match(/\/Date\((\d+)\)\//)
      if (match) {
        dateStr = new Date(parseInt(match[1])).toISOString()
      } else {
        dateStr = rawDate
      }
    }

    results.push({
      source: 'legislation',
      sourceUrl: bill.BillID
        ? `https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx?t=LawsAll&lawitemid=${bill.BillID}`
        : 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx',
      title,
      content: bill.SummaryLaw || bill.SubTypeDescription || title,
      date: dateStr,
    })
  }

  return results
}

// ─── Gov.il API ─────────────────────────────────────────────────────────────

async function scrapeGovDecisions(): Promise<ScrapedResult[]> {
  const results: ScrapedResult[] = []

  // Try the gov.il public search API for recent government decisions
  const govUrls = [
    'https://www.gov.il/he/api/PublicationApi/Index?limit=30&skip=0&PublicationType=Decision',
    'https://www.gov.il/he/api/PublicationApi/Index?limit=30&skip=0&PublicationType=Policy',
  ]

  for (const url of govUrls) {
    console.log(`[Gov.il API] Fetching: ${url}`)
    const data = await fetchJson(url)
    if (!data) continue

    const items: any[] = data?.results || data?.Results || data?.items || []
    if (!Array.isArray(items)) continue

    console.log(`[Gov.il API] Got ${items.length} items from ${url}`)

    for (const item of items.slice(0, 20)) {
      const title = item.Title || item.title || item.Name || ''
      if (!title || title.length < 3) continue

      results.push({
        source: 'gov_decision',
        sourceUrl: item.UrlName
          ? `https://www.gov.il/he/departments/policies/${item.UrlName}`
          : item.Url || item.url || 'https://www.gov.il/he/departments/policies',
        title,
        content: item.Description || item.description || item.Summary || title,
        date: item.PublishDate || item.publishDate || item.Date || undefined,
      })
    }
  }

  // Also try scraping the HTML page as fallback
  if (results.length === 0) {
    console.log('[Gov.il] API returned no results, trying HTML scrape fallback')
    const govSource = SCRAPING_SOURCES.find(s => s.id === 'gov_decisions')
    if (govSource) {
      const htmlResults = await scrapeHtmlSource(govSource)
      results.push(...htmlResults)
    }
  }

  return results
}

// ─── News Scraping via Google News RSS ──────────────────────────────────────

async function scrapeNewsForClient(
  clientId: string,
  keywords: string[]
): Promise<ScrapedResult[]> {
  const results: ScrapedResult[] = []
  const seenTitles = new Set<string>()

  // Search for each keyword (or combined keywords) via Google News RSS
  // We combine related keywords to get better results
  const searchQueries = buildSearchQueries(keywords)

  for (const query of searchQueries) {
    const encodedQuery = encodeURIComponent(query)
    const rssUrl = `${NEWS_SOURCES.googleNewsRss}?q=${encodedQuery}&hl=he&gl=IL&ceid=IL:he`
    console.log(`[News] Fetching RSS for query: "${query}"`)

    const xml = await fetchPage(rssUrl)
    if (!xml) continue

    const $ = cheerio.load(xml, { xmlMode: true })
    $('item').each((_, el) => {
      const $el = $(el)
      const title = $el.find('title').text().trim()
      const link = $el.find('link').text().trim()
      const pubDate = $el.find('pubDate').text().trim()
      const description = $el.find('description').text().trim()

      if (!title || title.length < 5) return

      // Deduplicate within this scrape run by normalized title
      const normalizedTitle = normalizeTitle(title)
      if (seenTitles.has(normalizedTitle)) return
      seenTitles.add(normalizedTitle)

      // Extract clean text from HTML description
      const cleanDesc = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

      results.push({
        source: 'news',
        sourceUrl: link || '',
        title,
        content: cleanDesc || title,
        date: pubDate ? new Date(pubDate).toISOString() : undefined,
      })
    })
  }

  console.log(`[News] Total news articles found: ${results.length}`)
  return results
}

/** Build smart search queries from keywords - combine related ones, avoid too many queries */
function buildSearchQueries(keywords: string[]): string[] {
  const queries: string[] = []

  // If few keywords, search each one individually
  if (keywords.length <= 3) {
    for (const kw of keywords) {
      queries.push(kw)
    }
  } else {
    // Group keywords into pairs/triples for more targeted results
    // First, search the top 3 keywords individually
    for (const kw of keywords.slice(0, 3)) {
      queries.push(kw)
    }
    // Then combine remaining keywords in pairs
    for (let i = 3; i < keywords.length && queries.length < 6; i += 2) {
      if (i + 1 < keywords.length) {
        queries.push(`${keywords[i]} ${keywords[i + 1]}`)
      } else {
        queries.push(keywords[i])
      }
    }
  }

  return queries.slice(0, 6) // Max 6 queries to avoid rate limiting
}

// ─── Deduplication & Relevance ──────────────────────────────────────────────

/** Normalize title for fuzzy dedup comparison */
function normalizeTitle(title: string): string {
  return title
    .replace(/[\u0591-\u05C7]/g, '') // Remove Hebrew diacritics (nikud)
    .replace(/["""''״׳]/g, '')        // Remove quotes
    .replace(/[-–—]/g, ' ')           // Normalize dashes
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .trim()
    .toLowerCase()
}

/** Check if two titles are similar enough to be considered duplicates */
function areTitlesSimilar(a: string, b: string): boolean {
  const normA = normalizeTitle(a)
  const normB = normalizeTitle(b)

  // Exact match after normalization
  if (normA === normB) return true

  // One contains the other (for cases where one source has a longer title)
  if (normA.length > 10 && normB.length > 10) {
    if (normA.includes(normB) || normB.includes(normA)) return true
  }

  // Check word overlap (Jaccard similarity) - if >70% words overlap, it's likely a dupe
  const wordsAArr = normA.split(' ').filter(w => w.length > 2)
  const wordsBArr = normB.split(' ').filter(w => w.length > 2)
  const wordsB = new Set(wordsBArr)
  if (wordsAArr.length >= 3 && wordsBArr.length >= 3) {
    let overlap = 0
    for (const w of wordsAArr) {
      if (wordsB.has(w)) overlap++
    }
    const union = new Set([...wordsAArr, ...wordsBArr])
    const jaccard = overlap / union.size
    if (jaccard > 0.7) return true
  }

  return false
}

/** Score relevance of an item to a client's keywords (0-1) */
function scoreRelevance(item: ScrapedResult, keywords: string[]): number {
  if (keywords.length === 0) return 0

  const text = `${item.title} ${item.content}`.toLowerCase()
  let matchCount = 0
  let titleMatchCount = 0
  const titleLower = item.title.toLowerCase()

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase()
    if (text.includes(kwLower)) {
      matchCount++
      if (titleLower.includes(kwLower)) {
        titleMatchCount++
      }
    }
  }

  // Title matches are worth more
  const baseScore = matchCount / keywords.length
  const titleBonus = titleMatchCount > 0 ? 0.2 : 0
  return Math.min(1, baseScore + titleBonus)
}

// ─── Client Matching ────────────────────────────────────────────────────────

interface ClientWithKeywords {
  id: string
  name: string
  keywords: string[]
}

async function getActiveClientsWithKeywords(): Promise<ClientWithKeywords[]> {
  const clients = await prisma.client.findMany({
    where: { status: 'active', keywords: { not: null } },
    select: { id: true, keywords: true, name: true },
  })

  return clients
    .filter(c => c.keywords && c.keywords.trim().length > 0)
    .map(c => ({
      id: c.id,
      name: c.name,
      keywords: c.keywords!.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0),
    }))
}

function matchItemToClient(item: ScrapedResult, clients: ClientWithKeywords[]): { clientId: string; relevance: number } | null {
  let bestMatch: { clientId: string; relevance: number } | null = null

  for (const client of clients) {
    const relevance = scoreRelevance(item, client.keywords)
    if (relevance > 0.1) { // Minimum threshold
      if (!bestMatch || relevance > bestMatch.relevance) {
        bestMatch = { clientId: client.id, relevance }
      }
    }
  }

  return bestMatch
}

// ─── Duplicate Check Against DB ─────────────────────────────────────────────

async function isDuplicateInDb(item: ScrapedResult): Promise<boolean> {
  // Check exact title+source match
  const exactMatch = await prisma.scrapedItem.findFirst({
    where: { title: item.title, source: item.source },
    select: { id: true },
  })
  if (exactMatch) return true

  // Check URL match (same article from same source)
  if (item.sourceUrl && item.sourceUrl.length > 10) {
    const urlMatch = await prisma.scrapedItem.findFirst({
      where: { sourceUrl: item.sourceUrl, source: item.source },
      select: { id: true },
    })
    if (urlMatch) return true
  }

  // For fuzzy dedup: check recent items with same source for similar titles
  const recentItems = await prisma.scrapedItem.findMany({
    where: { source: item.source },
    select: { title: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  for (const existing of recentItems) {
    if (areTitlesSimilar(item.title, existing.title)) {
      return true
    }
  }

  return false
}

// ─── Main Scraper ───────────────────────────────────────────────────────────

export async function runScraper(): Promise<{ added: number; errors: number; news: number }> {
  let added = 0
  let errors = 0
  let newsAdded = 0

  const clients = await getActiveClientsWithKeywords()
  console.log(`[Scraper] Found ${clients.length} active clients with keywords`)

  // ── 1. Scrape Knesset OData API (most reliable source) ──
  console.log('\n=== Knesset API Scraping ===')
  try {
    const committeeSessions = await scrapeKnessetCommitteeSessions()
    const bills = await scrapeKnessetBills()
    const apiResults = [...committeeSessions, ...bills]
    console.log(`[Knesset API] Total results: ${apiResults.length}`)

    for (const item of apiResults) {
      if (await isDuplicateInDb(item)) continue

      const match = matchItemToClient(item, clients)
      await prisma.scrapedItem.create({
        data: {
          source: item.source,
          sourceUrl: item.sourceUrl,
          title: item.title,
          content: item.content,
          date: item.date ? new Date(item.date) : null,
          committee: item.committee,
          clientId: match?.clientId || null,
          relevance: match?.relevance || null,
        },
      })
      added++
    }
  } catch (err) {
    console.error('[Knesset API] Error:', err)
    errors++
  }

  // ── 2. Scrape Gov.il decisions ──
  console.log('\n=== Gov.il Scraping ===')
  try {
    const govResults = await scrapeGovDecisions()
    console.log(`[Gov.il] Total results: ${govResults.length}`)

    for (const item of govResults) {
      if (await isDuplicateInDb(item)) continue

      const match = matchItemToClient(item, clients)
      await prisma.scrapedItem.create({
        data: {
          source: item.source,
          sourceUrl: item.sourceUrl,
          title: item.title,
          content: item.content,
          date: item.date ? new Date(item.date) : null,
          clientId: match?.clientId || null,
          relevance: match?.relevance || null,
        },
      })
      added++
    }
  } catch (err) {
    console.error('[Gov.il] Error:', err)
    errors++
  }

  // ── 3. Scrape HTML sources as fallback ──
  console.log('\n=== HTML Scraping (fallback) ===')
  for (const source of SCRAPING_SOURCES) {
    // Skip gov_decisions as we already handled it via API
    if (source.id === 'gov_decisions') continue

    try {
      const results = await scrapeHtmlSource(source)
      console.log(`[HTML] ${source.id}: ${results.length} results`)

      for (const item of results) {
        if (await isDuplicateInDb(item)) continue

        const match = matchItemToClient(item, clients)
        await prisma.scrapedItem.create({
          data: {
            source: item.source,
            sourceUrl: item.sourceUrl,
            title: item.title,
            content: item.content,
            date: item.date ? new Date(item.date) : null,
            committee: item.committee,
            clientId: match?.clientId || null,
            relevance: match?.relevance || null,
          },
        })
        added++
      }
    } catch (err) {
      console.error(`[HTML] Error scraping ${source.id}:`, err)
      errors++
    }
  }

  // ── 4. Scrape news articles for each client with keywords ──
  console.log('\n=== News Scraping ===')
  for (const client of clients) {
    try {
      console.log(`[News] Scraping news for client: ${client.name} (keywords: ${client.keywords.join(', ')})`)
      const newsResults = await scrapeNewsForClient(client.id, client.keywords)

      for (const item of newsResults) {
        if (await isDuplicateInDb(item)) continue

        // Score relevance specifically for this client
        const relevance = scoreRelevance(item, client.keywords)

        // Only save if truly relevant (relevance > 0.15)
        if (relevance < 0.15) continue

        await prisma.scrapedItem.create({
          data: {
            source: 'news',
            sourceUrl: item.sourceUrl,
            title: item.title,
            content: item.content,
            date: item.date ? new Date(item.date) : null,
            clientId: client.id,
            relevance,
          },
        })
        newsAdded++
        added++
      }
    } catch (err) {
      console.error(`[News] Error scraping for client ${client.name}:`, err)
      errors++
    }
  }

  console.log(`\n=== Scraper Complete ===`)
  console.log(`Added: ${added} (including ${newsAdded} news articles), Errors: ${errors}`)

  return { added, errors, news: newsAdded }
}

// ─── Also match unmatched items when keywords change ────────────────────────

export async function rematchUnassignedItems(): Promise<number> {
  const clients = await getActiveClientsWithKeywords()
  const unmatched = await prisma.scrapedItem.findMany({
    where: { clientId: null },
    select: { id: true, title: true, content: true, source: true, sourceUrl: true },
  })

  let matched = 0
  for (const item of unmatched) {
    const result: ScrapedResult = {
      source: item.source,
      sourceUrl: item.sourceUrl,
      title: item.title,
      content: item.content,
    }
    const match = matchItemToClient(result, clients)
    if (match) {
      await prisma.scrapedItem.update({
        where: { id: item.id },
        data: { clientId: match.clientId, relevance: match.relevance },
      })
      matched++
    }
  }

  return matched
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
