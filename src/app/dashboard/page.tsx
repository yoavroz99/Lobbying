'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  ClipboardList,
  Globe,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Newspaper,
  ExternalLink,
} from 'lucide-react'
import { labels, formatRelativeDate, statusColors, priorityColors } from '@/lib/utils/hebrew'
import { cn } from '@/lib/utils/cn'

interface DashboardData {
  clients: any[]
  tasks: any[]
  scrapedItems: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ clients: [], tasks: [], scrapedItems: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [clientsRes, tasksRes, scrapedRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/tasks'),
          fetch('/api/scrape'),
        ])
        const clients = await clientsRes.json()
        const tasks = await tasksRes.json()
        const scrapedItems = await scrapedRes.json()
        setData({
          clients: Array.isArray(clients) ? clients : [],
          tasks: Array.isArray(tasks) ? tasks : [],
          scrapedItems: Array.isArray(scrapedItems) ? scrapedItems : [],
        })
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const urgentTasks = data.tasks.filter((t: any) => t.priority === 'urgent' && t.status !== 'completed')
  const pendingTasks = data.tasks.filter((t: any) => t.status === 'pending')
  const inProgressTasks = data.tasks.filter((t: any) => t.status === 'in_progress')
  const completedTasks = data.tasks.filter((t: any) => t.status === 'completed')
  const recentScraped = data.scrapedItems.filter((i: any) => i.source !== 'news').slice(0, 5)
  const recentNews = data.scrapedItems.filter((i: any) => i.source === 'news').slice(0, 5)
  const newsCount = data.scrapedItems.filter((i: any) => i.source === 'news').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-knesset-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
        <p className="text-gray-500 mt-1">סקירה כללית של הפעילות</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="לקוחות פעילים"
          value={data.clients.filter((c: any) => c.status !== 'archived').length}
          color="blue"
        />
        <StatCard
          icon={ClipboardList}
          label="משימות פתוחות"
          value={pendingTasks.length + inProgressTasks.length}
          color="yellow"
        />
        <StatCard
          icon={CheckCircle}
          label="משימות שהושלמו"
          value={completedTasks.length}
          color="green"
        />
        <StatCard
          icon={Globe}
          label="עדכוני מידע"
          value={data.scrapedItems.length - newsCount}
          color="purple"
        />
        <StatCard
          icon={Newspaper}
          label="כתבות חדשות"
          value={newsCount}
          color="orange"
        />
      </div>

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-800">משימות דחופות</h2>
          </div>
          <div className="space-y-2">
            {urgentTasks.map((task: any) => (
              <div key={task.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-500">{task.client?.name}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full', statusColors[task.status])}>
                  {labels.task.statuses[task.status as keyof typeof labels.task.statuses]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent News Articles */}
      {recentNews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-orange-500" />
              כתבות חדשות אחרונות
            </h2>
            <Link href="/dashboard/scraping" className="text-sm text-knesset-blue hover:underline">
              הצג הכל
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentNews.map((item: any) => (
              <a
                key={item.id}
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-orange-100 bg-orange-50/30 hover:bg-orange-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 line-clamp-2 flex items-start gap-1">
                  {item.title}
                  <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-400" />
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {item.client && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{item.client.name}</span>
                  )}
                  <span className="text-xs text-gray-300">{formatRelativeDate(item.createdAt)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              משימות אחרונות
            </h2>
            <Link href="/dashboard/tasks" className="text-sm text-knesset-blue hover:underline">
              הצג הכל
            </Link>
          </div>
          <div className="space-y-3">
            {data.tasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', {
                  'bg-gray-300': task.priority === 'low',
                  'bg-blue-500': task.priority === 'medium',
                  'bg-orange-500': task.priority === 'high',
                  'bg-red-500': task.priority === 'urgent',
                })} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.client?.name}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[task.status])}>
                  {labels.task.statuses[task.status as keyof typeof labels.task.statuses]}
                </span>
              </div>
            ))}
            {data.tasks.length === 0 && (
              <p className="text-center text-gray-400 py-4">אין משימות עדיין</p>
            )}
          </div>
        </div>

        {/* Recent Scraped Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" />
              עדכוני מידע אחרונים
            </h2>
            <Link href="/dashboard/scraping" className="text-sm text-knesset-blue hover:underline">
              הצג הכל
            </Link>
          </div>
          <div className="space-y-3">
            {recentScraped.map((item: any) => (
              <div key={item.id} className="py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {labels.scrape.sources[item.source as keyof typeof labels.scrape.sources]}
                  </span>
                  {item.client && (
                    <span className="text-xs text-gray-400">{item.client.name}</span>
                  )}
                  <span className="text-xs text-gray-300">
                    {formatRelativeDate(item.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {recentScraped.length === 0 && (
              <p className="text-center text-gray-400 py-4">אין עדכונים עדיין</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-knesset-gold" />
          פעולות מהירות
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction href="/dashboard/ai?type=summarize" label="סכם דיון ועדה" icon={ClipboardList} />
          <QuickAction href="/dashboard/ai?type=letter" label="כתוב מכתב" icon={TrendingUp} />
          <QuickAction href="/dashboard/ai?type=strategy" label="צור תוכנית אסטרטגית" icon={Sparkles} />
          <QuickAction href="/dashboard/scraping" label="עדכן מידע מהכנסת" icon={Globe} />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: number
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 card-hover">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colorClasses[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: any
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-knesset-blue hover:bg-blue-50 transition-all text-center"
    >
      <Icon className="w-6 h-6 text-knesset-blue" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  )
}
