'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Plus,
  ClipboardList,
  Globe,
  Sparkles,
  Edit3,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { labels, statusColors, priorityColors, formatRelativeDate } from '@/lib/utils/hebrew'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [scraped, setScraped] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    industry: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    keywords: '',
    status: 'active',
  })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'medium',
    dueDate: '',
  })

  useEffect(() => {
    loadData()
  }, [clientId])

  async function loadData() {
    const [clientsRes, tasksRes, scrapedRes] = await Promise.all([
      fetch('/api/clients'),
      fetch(`/api/tasks?clientId=${clientId}`),
      fetch(`/api/scrape?clientId=${clientId}`),
    ])
    const clients = await clientsRes.json()
    const c = Array.isArray(clients) ? clients.find((x: any) => x.id === clientId) : null
    setClient(c)
    setTasks(Array.isArray(await tasksRes.json().catch(() => [])) ? await tasksRes.json().catch(() => []) : [])
    setScraped(Array.isArray(await scrapedRes.json().catch(() => [])) ? await scrapedRes.json().catch(() => []) : [])
    setLoading(false)
  }

  // Re-load properly
  useEffect(() => {
    async function load() {
      try {
        const [clientsRes, tasksRes, scrapedRes] = await Promise.all([
          fetch('/api/clients'),
          fetch(`/api/tasks?clientId=${clientId}`),
          fetch(`/api/scrape?clientId=${clientId}`),
        ])
        const clientsData = await clientsRes.json()
        const tasksData = await tasksRes.json()
        const scrapedData = await scrapedRes.json()
        setClient(Array.isArray(clientsData) ? clientsData.find((x: any) => x.id === clientId) : null)
        setTasks(Array.isArray(tasksData) ? tasksData : [])
        setScraped(Array.isArray(scrapedData) ? scrapedData : [])
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, clientId }),
    })
    setTaskForm({ title: '', description: '', type: 'general', priority: 'medium', dueDate: '' })
    setShowTaskForm(false)
    // Reload tasks
    const res = await fetch(`/api/tasks?clientId=${clientId}`)
    setTasks(await res.json())
  }

  async function updateTaskStatus(taskId: string, status: string) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status }),
    })
    const res = await fetch(`/api/tasks?clientId=${clientId}`)
    setTasks(await res.json())
  }

  function startEditing() {
    setEditForm({
      name: client.name || '',
      industry: client.industry || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      description: client.description || '',
      keywords: client.keywords || '',
      status: client.status || 'active',
    })
    setEditing(true)
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId, ...editForm }),
    })
    setEditing(false)
    // Reload client data
    const res = await fetch('/api/clients')
    const clients = await res.json()
    setClient(Array.isArray(clients) ? clients.find((x: any) => x.id === clientId) : null)
  }

  async function deleteClient() {
    if (!confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return
    await fetch(`/api/clients?id=${clientId}`, { method: 'DELETE' })
    router.push('/clients')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-knesset-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return <div className="text-center py-12 text-gray-500">לקוח לא נמצא</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clients" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          {client.industry && <p className="text-gray-500">{client.industry}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-knesset-blue px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <Edit3 className="w-4 h-4" />
            {labels.actions.edit}
          </button>
          <button
            onClick={deleteClient}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <Trash2 className="w-4 h-4" />
            {labels.actions.delete}
          </button>
        </div>
      </div>

      {/* Edit Client Form */}
      {editing && (
        <form onSubmit={saveClient} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-bold text-gray-800">עריכת לקוח</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם הלקוח *</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תעשייה</label>
              <input type="text" value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">איש קשר</label>
              <input type="text" value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
              <input type="text" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} dir="ltr" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input type="text" value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} dir="ltr" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מילות מפתח (מופרדות בפסיקים)</label>
              <input type="text" value={editForm.keywords} onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm">
                {Object.entries(labels.client.statuses).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm" rows={3} />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-knesset-blue text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-900">
              {labels.actions.save}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-gray-500 px-4 py-2 text-sm">
              {labels.actions.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Client Info */}
      {!editing && (client.description || client.keywords || client.contactName || client.contactEmail || client.contactPhone) && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          {(client.contactName || client.contactEmail || client.contactPhone) && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              {client.contactName && <span>איש קשר: {client.contactName}</span>}
              {client.contactEmail && <span dir="ltr">{client.contactEmail}</span>}
              {client.contactPhone && <span dir="ltr">{client.contactPhone}</span>}
            </div>
          )}
          {client.description && <p className="text-gray-700 mb-2">{client.description}</p>}
          {client.keywords && (
            <div className="flex flex-wrap gap-2 mt-3">
              {client.keywords.split(',').map((kw: string, i: number) => (
                <span key={i} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">
                  {kw.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Section */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-400" />
            משימות ({tasks.length})
          </h2>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="flex items-center gap-1 text-sm text-knesset-blue hover:underline"
          >
            <Plus className="w-4 h-4" />
            משימה חדשה
          </button>
        </div>

        {showTaskForm && (
          <form onSubmit={createTask} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="כותרת המשימה"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              required
            />
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="תיאור (אופציונלי)"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              rows={2}
            />
            <div className="grid grid-cols-3 gap-3">
              <select
                value={taskForm.type}
                onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                className="px-3 py-2 rounded-lg border text-sm"
              >
                {Object.entries(labels.task.types).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="px-3 py-2 rounded-lg border text-sm"
              >
                {Object.entries(labels.task.priorities).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="px-3 py-2 rounded-lg border text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-knesset-blue text-white px-4 py-2 rounded-lg text-sm">
                {labels.actions.create}
              </button>
              <button type="button" onClick={() => setShowTaskForm(false)} className="text-gray-500 text-sm">
                {labels.actions.cancel}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 task-card">
              <button
                onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                  task.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-knesset-blue'
                )}
              >
                {task.status === 'completed' && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', task.status === 'completed' && 'line-through text-gray-400')}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityColors[task.priority])}>
                    {labels.task.priorities[task.priority as keyof typeof labels.task.priorities]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {labels.task.types[task.type as keyof typeof labels.task.types]}
                  </span>
                </div>
              </div>
              {task.status !== 'completed' && task.status !== 'in_progress' && (
                <button
                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                  className="text-xs text-knesset-blue hover:underline"
                >
                  התחל
                </button>
              )}
              {task.aiGenerated && (
                <Sparkles className="w-4 h-4 text-knesset-gold flex-shrink-0" />
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-gray-400 py-4">אין משימות ללקוח זה</p>
          )}
        </div>
      </div>

      {/* Scraped Items for this client */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-gray-400" />
          עדכוני מידע רלוונטיים ({scraped.length})
        </h2>
        <div className="space-y-3">
          {scraped.map((item) => (
            <div key={item.id} className="p-3 rounded-lg border border-gray-100">
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-knesset-blue hover:underline"
              >
                {item.title}
              </a>
              {item.summary && (
                <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {labels.scrape.sources[item.source as keyof typeof labels.scrape.sources]} • {formatRelativeDate(item.createdAt)}
              </p>
            </div>
          ))}
          {scraped.length === 0 && (
            <p className="text-center text-gray-400 py-4">אין עדכונים רלוונטיים</p>
          )}
        </div>
      </div>

      {/* AI Quick Actions for this client */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-knesset-gold" />
          כלי AI ללקוח
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href={`/dashboard/ai?type=summarize&clientId=${clientId}`}
            className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium">סכם דיון ועדה</p>
          </Link>
          <Link
            href={`/dashboard/ai?type=letter&clientId=${clientId}`}
            className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium">כתוב מכתב</p>
          </Link>
          <Link
            href={`/dashboard/ai?type=strategy&clientId=${clientId}`}
            className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium">צור תוכנית אסטרטגית</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
