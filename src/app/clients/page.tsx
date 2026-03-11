'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { labels } from '@/lib/utils/hebrew'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    industry: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    keywords: '',
  })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function createClient(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'שגיאה ביצירת לקוח')
        return
      }
      setForm({ name: '', industry: '', contactName: '', contactEmail: '', contactPhone: '', description: '', keywords: '' })
      setShowForm(false)
      loadClients()
    } catch {
      alert('שגיאה ביצירת לקוח')
    }
  }

  const filtered = clients.filter((c) =>
    c.name.includes(search) || c.industry?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
          <p className="text-gray-500 mt-1">ניהול לקוחות ותיקים</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-knesset-blue text-white px-4 py-2.5 rounded-lg hover:bg-blue-900 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>לקוח חדש</span>
        </button>
      </div>

      {/* New Client Form */}
      {showForm && (
        <form onSubmit={createClient} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-bold text-gray-800">לקוח חדש</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="שם הלקוח *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label="תעשייה" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
            <Input label="איש קשר" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
            <Input label="אימייל" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} dir="ltr" />
            <Input label="טלפון" value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} dir="ltr" />
            <Input label="מילות מפתח (מופרדות בפסיקים)" value={form.keywords} onChange={(v) => setForm({ ...form, keywords: v })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-knesset-blue text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-900">
              {labels.actions.save}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm">
              {labels.actions.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לקוחות..."
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none"
        />
      </div>

      {/* Client Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-3 border-knesset-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין לקוחות עדיין</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 card-hover block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{client.name}</h3>
                  {client.industry && (
                    <p className="text-sm text-gray-500 mt-1">{client.industry}</p>
                  )}
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {labels.client.statuses[client.status as keyof typeof labels.client.statuses]}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>{client._count?.tasks || 0} משימות</span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  required,
  dir,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  dir?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        dir={dir}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm"
      />
    </div>
  )
}
