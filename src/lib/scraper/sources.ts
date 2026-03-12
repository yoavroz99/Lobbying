// Knesset and government website scraping sources
// These URLs are from official Israeli government open data sources

export interface ScrapingSource {
  id: string
  name: string
  nameHe: string
  baseUrl: string
  type: 'knesset_committee' | 'knesset_plenum' | 'gov_decision' | 'legislation' | 'news'
  selectors: {
    itemList: string
    title: string
    content: string
    date: string
    link: string
  }
}

export const SCRAPING_SOURCES: ScrapingSource[] = [
  {
    id: 'knesset_committees',
    name: 'Knesset Committees',
    nameHe: 'ועדות הכנסת',
    baseUrl: 'https://main.knesset.gov.il/Activity/committees/Pages/AllCommitteeSchedule.aspx',
    type: 'knesset_committee',
    selectors: {
      itemList: '.agenda-item, .CommitteeScheduleItem, table.rgMasterTable tr',
      title: '.agenda-title, .CommitteeScheduleTitle, td:nth-child(2)',
      content: '.agenda-desc, .CommitteeScheduleDesc, td:nth-child(3)',
      date: '.agenda-date, .CommitteeScheduleDate, td:nth-child(1)',
      link: 'a',
    },
  },
  {
    id: 'knesset_plenum',
    name: 'Knesset Plenum',
    nameHe: 'מליאת הכנסת',
    baseUrl: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawReshumot.aspx',
    type: 'knesset_plenum',
    selectors: {
      itemList: '.law-item, table.rgMasterTable tr',
      title: '.law-title, td:nth-child(2)',
      content: '.law-desc, td:nth-child(3)',
      date: '.law-date, td:nth-child(1)',
      link: 'a',
    },
  },
  {
    id: 'gov_decisions',
    name: 'Government Decisions',
    nameHe: 'החלטות ממשלה',
    baseUrl: 'https://www.gov.il/he/departments/policies?OfficeId=104cb0f4-d65a-4692-b590-94af928c19c0',
    type: 'gov_decision',
    selectors: {
      itemList: '.gov-result-item, .search-result-item',
      title: '.gov-result-title, .result-title, h3',
      content: '.gov-result-desc, .result-description, p',
      date: '.gov-result-date, .result-date, time',
      link: 'a',
    },
  },
  {
    id: 'knesset_legislation',
    name: 'Legislation',
    nameHe: 'הצעות חוק',
    baseUrl: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx',
    type: 'legislation',
    selectors: {
      itemList: '.bill-item, table.rgMasterTable tr',
      title: '.bill-title, td:nth-child(2)',
      content: '.bill-desc, td:nth-child(3)',
      date: '.bill-date, td:nth-child(1)',
      link: 'a',
    },
  },
]

// Knesset Open Data API (JSON-based, more reliable than HTML scraping)
export const KNESSET_API = {
  base: 'https://knesset.gov.il/Odata/ParliamentInfo.svc',
  endpoints: {
    committees: '/KNS_Committee?$format=json',
    committeeSessions: '/KNS_CommitteeSessions?$format=json&$orderby=StartDate%20desc&$top=50',
    bills: '/KNS_Bill?$format=json&$orderby=LastUpdatedDate%20desc&$top=50',
    members: '/KNS_Person?$format=json',
  },
} as const

// Gov.il API for government decisions and publications
export const GOV_IL_API = {
  // Gov.il exposes a public search/publications API
  searchUrl: 'https://www.gov.il/he/api/PublicationApi/Index',
  decisionsUrl: 'https://www.gov.il/he/api/DecisionApi/Index',
} as const

// Google News RSS for Hebrew news search
export const NEWS_SOURCES = {
  googleNewsRss: 'https://news.google.com/rss/search',
} as const
