'use client'

import { useEffect, useState } from 'react'
import { Plus, Filter, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { labels, statusColors, priorityColors, formatHebrewDate } from '@/lib/utils/hebrew'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', clientId: '', type: '' })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', type: 'general', priority: 'medium', clientId: '', dueDate: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([t, c]) => {
      setTasks(Array.isArray(t) ? t : [])
      setClients(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }, [])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ title: '', description: '', type: 'general', priority: 'medium', clientId: '', dueDate: '' })
    setShowForm(false)
    const res = await fetch('/api/tasks')
    setTasks(await res.json())
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const res = await fetch('/api/tasks')
    setTasks(await res.json())
  }

  const filtered = tasks.filter((t) => {
    if (filter.status && t.status !== filter.status) return false
    if (filter.clientId && t.clientId !== filter.clientId) return false
    if (filter.type && t.type !== filter.type) return false
    return true
  })

  // Group by status
  const grouped = {
    urgent: filtered.filter((t) => t.priority === 'urgent' && t.status !== 'completed'),
    in_progress: filtered.filter((t) => t.status === 'in_progress'),
    pending: filtered.filter((t) => t.status === 'pending' && t.priority !== 'urgent'),
    completed: filtered.filter((t) => t.status === 'completed'),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-knesset-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">משימות</h1>
          <p className="text-gray-500 mt-1">ניהול משימות לכל הלקוחות</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-knesset-blue text-white px-4 py-2.5 rounded-lg hover:bg-blue-900 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          משימה חדשה
        </button>
      </div>

      {/* New Task Form */}
      {showForm && (
        <form onSubmit={createTask} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="כותרת המשימה *"
            className="w-full px-3 py-2.5 rounded-lg border text-sm"
            required
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="תיאור"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            rows={2}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="px-3 py-2 rounded-lg border text-sm" required>
              <option value="">בחר לקוח *</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg border text-sm">
              {Object.entries(labels.task.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="px-3 py-2 rounded-lg border text-sm">
              {Object.entries(labels.task.priorities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="px-3 py-2 rounded-lg border text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-knesset-blue text-white px-6 py-2 rounded-lg text-sm">{labels.actions.create}</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm">{labels.actions.cancel}</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="px-3 py-1.5 rounded-lg border text-sm">
          <option value="">כל הסטטוסים</option>
          {Object.entries(labels.task.statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.clientId} onChange={(e) => setFilter({ ...filter, clientId: e.target.value })} className="px-3 py-1.5 rounded-lg border text-sm">
          <option value="">כל הלקוחות</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} className="px-3 py-1.5 rounded-lg border text-sm">
          <option value="">כל הסוגים</option>
          {Object.entries(labels.task.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Task Sections */}
      {grouped.urgent.length > 0 && (
        <TaskSection title="דחוף" tasks={grouped.urgent} color="red" onStatusChange={updateStatus} />
      )}
      <TaskSection title="בביצוע" tasks={grouped.in_progress} color="blue" onStatusChange={updateStatus} />
      <TaskSection title="ממתין" tasks={grouped.pending} color="yellow" onStatusChange={updateStatus} />
      {grouped.completed.length > 0 && (
        <TaskSection title="הושלם" tasks={grouped.completed} color="green" onStatusChange={updateStatus} />
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין משימות</p>
        </div>
      )}
    </div>
  )
}

function TaskSection({
  title,
  tasks,
  color,
  onStatusChange,
}: {
  title: string
  tasks: any[]
  color: string
  onStatusChange: (id: string, status: string) => void
}) {
  if (tasks.length === 0) return null

  const borderColors: Record<string, string> = {
    red: 'border-r-red-500',
    blue: 'border-r-blue-500',
    yellow: 'border-r-yellow-500',
    green: 'border-r-green-500',
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-500 mb-2">{title} ({tasks.length})</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              'bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center gap-3 card-hover border-r-4',
              borderColors[color]
            )}
          >
            <button
              onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
              className={cn(
                'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-knesset-blue'
              )}
            >
              {task.status === 'completed' && <span className="text-xs">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium text-sm', task.status === 'completed' && 'line-through text-gray-400')}>
                {task.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{task.client?.name}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityColors[task.priority])}>
                  {labels.task.priorities[task.priority as keyof typeof labels.task.priorities]}
                </span>
                <span className="text-xs text-gray-300">
                  {labels.task.types[task.type as keyof typeof labels.task.types]}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-gray-400">
                    עד {formatHebrewDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>
            {task.status === 'pending' && (
              <button onClick={() => onStatusChange(task.id, 'in_progress')} className="text-xs text-knesset-blue hover:underline flex-shrink-0">
                התחל
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
