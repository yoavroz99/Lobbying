import { PrismaClient } from '@prisma/client'

// Set up prisma for the standalone script
const prisma = new PrismaClient()

// We need to run the scraper functions directly since module resolution
// with @/ paths requires Next.js context. Let's inline the key logic.

async function main() {
  console.log('=== Lobby Scraper Test Run ===\n')

  // Check the client
  const clients = await prisma.client.findMany({
    where: { status: 'active', keywords: { not: null } },
    select: { id: true, name: true, keywords: true },
  })

  console.log(`Active clients with keywords: ${clients.length}`)
  for (const c of clients) {
    console.log(`  - ${c.name}: ${c.keywords}`)
  }

  console.log('\n--- Testing Knesset OData API ---')

  // Test committee sessions
  try {
    const url = 'https://knesset.gov.il/Odata/ParliamentInfo.svc/KNS_CommitteeSessions?$format=json&$orderby=StartDate%20desc&$top=5'
    console.log(`Fetching: ${url}`)
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000),
    })
    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      const sessions = data?.d?.results || data?.d || data?.value || []
      console.log(`Committee sessions count: ${Array.isArray(sessions) ? sessions.length : 'N/A (type: ' + typeof sessions + ')'}`)
      if (Array.isArray(sessions) && sessions.length > 0) {
        const first = sessions[0]
        console.log('Sample session keys:', Object.keys(first).join(', '))
        console.log('Sample:', JSON.stringify(first, null, 2).slice(0, 500))
      }
    } else {
      const text = await response.text()
      console.log('Error body:', text.slice(0, 300))
    }
  } catch (err: any) {
    console.error('Knesset committee sessions error:', err.message)
  }

  // Test bills
  try {
    const url = 'https://knesset.gov.il/Odata/ParliamentInfo.svc/KNS_Bill?$format=json&$orderby=LastUpdatedDate%20desc&$top=5'
    console.log(`\nFetching bills: ${url}`)
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000),
    })
    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      const bills = data?.d?.results || data?.d || data?.value || []
      console.log(`Bills count: ${Array.isArray(bills) ? bills.length : 'N/A'}`)
      if (Array.isArray(bills) && bills.length > 0) {
        const first = bills[0]
        console.log('Sample bill keys:', Object.keys(first).join(', '))
        console.log('Sample:', JSON.stringify(first, null, 2).slice(0, 500))
      }
    }
  } catch (err: any) {
    console.error('Knesset bills error:', err.message)
  }

  // Test Gov.il API
  console.log('\n--- Testing Gov.il API ---')
  for (const url of [
    'https://www.gov.il/he/api/PublicationApi/Index?limit=5&skip=0&PublicationType=Decision',
    'https://www.gov.il/he/api/PublicationApi/Index?limit=5&skip=0&PublicationType=Policy',
  ]) {
    try {
      console.log(`\nFetching: ${url}`)
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; LobbyistPro/1.0)',
        },
        signal: AbortSignal.timeout(20000),
      })
      console.log(`Status: ${response.status}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Response keys:', Object.keys(data || {}).join(', '))
        const items = data?.results || data?.Results || data?.items || []
        console.log(`Items count: ${Array.isArray(items) ? items.length : 'N/A'}`)
        if (Array.isArray(items) && items.length > 0) {
          console.log('Sample keys:', Object.keys(items[0]).join(', '))
          console.log('Sample:', JSON.stringify(items[0], null, 2).slice(0, 500))
        }
      } else {
        const text = await response.text()
        console.log('Error:', text.slice(0, 300))
      }
    } catch (err: any) {
      console.error('Gov.il error:', err.message)
    }
  }

  // Test Google News RSS
  console.log('\n--- Testing Google News RSS ---')
  try {
    const query = encodeURIComponent('טכנולוגיה ישראל')
    const url = `https://news.google.com/rss/search?q=${query}&hl=he&gl=IL&ceid=IL:he`
    console.log(`Fetching: ${url}`)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
    })
    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const text = await response.text()
      // Quick parse with regex since we don't have cheerio in this context
      const titles: string[] = []
      const cdataRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g
      let match: RegExpExecArray | null
      while ((match = cdataRegex.exec(text)) !== null) {
        titles.push(match[1])
      }
      const plainRegex = /<title>(.*?)<\/title>/g
      while ((match = plainRegex.exec(text)) !== null) {
        titles.push(match[1])
      }
      const allTitles = titles
      console.log(`News articles found: ${allTitles.length}`)
      for (const t of allTitles.slice(0, 5)) {
        console.log(`  - ${t}`)
      }
    } else {
      console.log('Error status:', response.status)
    }
  } catch (err: any) {
    console.error('Google News RSS error:', err.message)
  }

  console.log('\n=== Test Complete ===')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
