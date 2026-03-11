'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Users,
  Edit3,
  Trash2,
  Shield,
  Save,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { labels } from '@/lib/utils/hebrew'

interface UserData {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  title: string | null
  bio: string | null
  createdAt: string
  _count?: { tasks: number; clients: number }
}

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'lobbyist',
    phone: '',
    title: '',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    phone: '',
    title: '',
    password: '',
  })
  const [message, setMessage] = useState('')

  const isAdmin = (session?.user as any)?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin])

  async function loadUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('המשתמש נוצר בהצלחה')
      setForm({ name: '', email: '', password: '', role: 'lobbyist', phone: '', title: '' })
      setShowForm(false)
      loadUsers()
    } else {
      setMessage(data.error || 'שגיאה ביצירת משתמש')
    }
  }

  function startEdit(user: UserData) {
    setEditingUser(user.id)
    setEditForm({
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      title: user.title || '',
      password: '',
    })
  }

  async function saveEdit(userId: string) {
    setMessage('')
    const body: any = { id: userId, ...editForm }
    if (!body.password) delete body.password

    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setMessage('המשתמש עודכן בהצלחה')
      setEditingUser(null)
      loadUsers()
    } else {
      const data = await res.json()
      setMessage(data.error || 'שגיאה בעדכון משתמש')
    }
  }

  async function deleteUser(userId: string, userName: string) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${userName}?`)) return
    const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage('המשתמש נמחק')
      loadUsers()
    } else {
      const data = await res.json()
      setMessage(data.error || 'שגיאה במחיקת משתמש')
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">אין לך הרשאות לצפות בדף זה</p>
        <p className="text-sm text-gray-400 mt-1">רק מנהלים יכולים לנהל משתמשים</p>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-400" />
            ניהול שדלנים
          </h1>
          <p className="text-gray-500 mt-1">הוספה, עריכה ומחיקה של פרופילי שדלנים</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-knesset-blue text-white px-4 py-2.5 rounded-lg hover:bg-blue-900 transition-colors text-sm"
        >
          <UserPlus className="w-4 h-4" />
          שדלן חדש
        </button>
      </div>

      {message && (
        <div className={cn(
          'px-4 py-3 rounded-lg text-sm',
          message.includes('שגיאה') || message.includes('לא ניתן')
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        )}>
          {message}
        </div>
      )}

      {/* New User Form */}
      {showForm && (
        <form onSubmit={createUser} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-bold text-gray-800">הוספת שדלן חדש</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                placeholder="ישראל ישראלי"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימייל *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                placeholder="user@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-lg border text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
              >
                {Object.entries(labels.user.roles).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg border text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד/כותרת</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                placeholder="שדלן בכיר, מנהל לקוחות..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-knesset-blue text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-900">
              {labels.actions.create}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm">
              {labels.actions.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            {editingUser === user.id ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                    >
                      {Object.entries(labels.user.roles).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה (השאר ריק לללא שינוי)</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(user.id)}
                    className="flex items-center gap-1 bg-knesset-blue text-white px-4 py-2 rounded-lg text-sm"
                  >
                    <Save className="w-4 h-4" />
                    {labels.actions.save}
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex items-center gap-1 text-gray-500 px-4 py-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    {labels.actions.cancel}
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-knesset-blue/10 flex items-center justify-center text-knesset-blue font-bold text-lg flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {labels.user.roles[user.role as keyof typeof labels.user.roles]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500" dir="ltr">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                    {user.title && <span>{user.title}</span>}
                    {user.phone && <span dir="ltr">{user.phone}</span>}
                    <span>{user._count?.tasks || 0} משימות</span>
                    <span>{user._count?.clients || 0} לקוחות</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(user)}
                    className="p-2 text-gray-400 hover:text-knesset-blue hover:bg-gray-100 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteUser(user.id, user.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין משתמשים</p>
          </div>
        )}
      </div>
    </div>
  )
}
