'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Save, Shield } from 'lucide-react'
import { labels } from '@/lib/utils/hebrew'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    bio: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session?.user) {
      fetch('/api/profile').then((r) => r.json()).then((data) => {
        if (data && !data.error) {
          setForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            title: data.title || '',
            bio: data.bio || '',
          })
        }
      })
    }
  }, [session])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setMessage('הפרופיל עודכן בהצלחה')
        update()
      } else {
        setMessage('שגיאה בעדכון הפרופיל')
      }
    } catch {
      setMessage('שגיאה בעדכון הפרופיל')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage('הסיסמאות אינן תואמות')
      return
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      })
      if (res.ok) {
        setMessage('הסיסמה עודכנה בהצלחה')
        setPasswordForm({ current: '', new: '', confirm: '' })
      } else {
        const data = await res.json()
        setMessage(data.error || 'שגיאה בעדכון הסיסמה')
      }
    } catch {
      setMessage('שגיאה בעדכון הסיסמה')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6 text-gray-400" />
          פרופיל
        </h1>
        <p className="text-gray-500 mt-1">ניהול פרטים אישיים והגדרות</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('שגיאה') || message.includes('אינן') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={saveProfile} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="font-bold text-gray-800">פרטים אישיים</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 text-gray-500"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="שדלן בכיר, מנהל לקוחות..."
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">אודות</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            rows={3}
            placeholder="ספר על עצמך ועל הניסיון שלך..."
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-knesset-blue text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-900 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'שומר...' : labels.actions.save}
        </button>
      </form>

      {/* Password Change */}
      <form onSubmit={changePassword} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-400" />
          שינוי סיסמה
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה נוכחית</label>
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
            <input
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה חדשה</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              required
            />
          </div>
        </div>
        <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-900">
          עדכן סיסמה
        </button>
      </form>

      {/* Account info */}
      <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500">
        <p>תפקיד: {labels.user.roles[(session?.user as any)?.role as keyof typeof labels.user.roles] || 'שדלן'}</p>
      </div>
    </div>
  )
}
