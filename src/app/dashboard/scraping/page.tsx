'use client'

import { useEffect, useState } from 'react'
import { Globe, RefreshCw, ExternalLink, Sparkles, Filter, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { labels, formatRelativeDate } from '@/lib/utils/hebrew'

export default function ScrapingPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [filter, setFilter] = useState({ source: '', clientId: '' })
  const [clients, setClients] = useState<any[]>([])
  const [summarizing, setSummarizing] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/scrape').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([s, c]) => {
      setItems(Array.isArray(s) ? s : [])
      setClients(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }, [])

  async function runScrape() {
    setScraping(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape' }),
      })
      const result = await res.json()
      // Reload items
      const itemsRes = await fetch('/api/scrape')
      setItems(await itemsRes.json())
      alert(`סריקה הושלמה: ${result.added} פריטים חדשים${result.news ? ` (${result.news} כתבות)` : ''}`)
    } catch {
      alert('שגיאה בסריקה')
    } finally {
      setScraping(false)
    }
  }

  async function summarizeItem(itemId: string) {
    setSummarizing(itemId)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize', itemId }),
      })
      const data = await res.json()
      setItems((prev) =>
        prev.map((item) => item.id === itemId ? { ...item, summary: data.summary } : item)
      )
    } catch {
      alert('שגיאה ביצירת סיכום')
    } finally {
      setSummarizing(null)
    }
  }

  const filtered = items.filter((item) => {
    if (filter.source && item.source !== filter.source) return false
    if (filter.clientId && item.clientId !== filter.clientId) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מעקב מידע</h1>
          <p className="text-gray-500 mt-1">מידע מהכנסת, הממשלה וגורמי חקיקה</p>
        </div>
        <button
          onClick={runScrape}
          disabled={scraping}
          className="flex items-center gap-2 bg-knesset-blue text-white px-4 py-2.5 rounded-lg hover:bg-blue-900 transition-colors text-sm disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', scraping && 'animate-spin')} />
          {scraping ? 'סורק...' : 'סרוק עכשיו'}
        </button>
      </div>

      {/* Source stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(labels.scrape.sources).map(([key, label]) => {
          const count = items.filter((i) => i.source === key).length
          return (
            <button
              key={key}
              onClick={() => setFilter({ ...filter, source: filter.source === key ? '' : key })}
              className={cn(
                'bg-white rounded-xl p-4 border text-right transition-colors',
                filter.source === key ? 'border-knesset-blue bg-blue-50' : 'border-gray-100 hover:border-gray-300'
              )}
            >
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filter.clientId}
          onChange={(e) => setFilter({ ...filter, clientId: e.target.value })}
          className="px-3 py-1.5 rounded-lg border text-sm"
        >
          <option value="">כל הלקוחות</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filter.source || filter.clientId) && (
          <button onClick={() => setFilter({ source: '', clientId: '' })} className="text-sm text-red-500 hover:underline">
            נקה סינון
          </button>
        )}
      </div>

      {/* Items */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-3 border-knesset-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded flex items-center gap-1',
                      item.source === 'news' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {item.source === 'news' && <Newspaper className="w-3 h-3" />}
                      {labels.scrape.sources[item.source as keyof typeof labels.scrape.sources]}
                    </span>
                    {item.committee && (
                      <span className="text-xs text-gray-400">{item.committee}</span>
                    )}
                    {item.client && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {item.client.name}
                      </span>
                    )}
                    {item.relevance != null && item.relevance > 0 && (
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        item.relevance > 0.5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        רלוונטיות: {Math.round(item.relevance * 100)}%
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  {item.content && item.content !== item.title && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                  )}
                  {item.summary && (
                    <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-yellow-700 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> סיכום AI
                      </p>
                      <p className="text-sm text-yellow-900">{item.summary}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-knesset-blue"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {!item.summary && (
                    <button
                      onClick={() => summarizeItem(item.id)}
                      disabled={summarizing === item.id}
                      className="text-knesset-gold hover:text-yellow-600 disabled:opacity-50"
                    >
                      <Sparkles className={cn('w-4 h-4', summarizing === item.id && 'animate-spin-slow')} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-2">{formatRelativeDate(item.createdAt)}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>אין עדכונים. לחץ &quot;סרוק עכשיו&quot; לאיסוף מידע.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
