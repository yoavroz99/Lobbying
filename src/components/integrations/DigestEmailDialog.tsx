'use client'

import { useState } from 'react'
import { Mail, Send, FileText, X, Loader2 } from 'lucide-react'

interface DigestEmailDialogProps {
  clientId: string
  clientName: string
  contactEmail?: string
  onClose: () => void
}

export default function DigestEmailDialog({ clientId, clientName, contactEmail, onClose }: DigestEmailDialogProps) {
  const [recipients, setRecipients] = useState(contactEmail || '')
  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ status: string; message: string } | null>(null)

  async function generatePreview() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/digest/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (res.ok) {
        setPreview(data.htmlBody)
        if (!subject) setSubject(data.subject)
      } else {
        setResult({ status: 'error', message: data.error || 'שגיאה ביצירת תצוגה מקדימה' })
      }
    } catch {
      setResult({ status: 'error', message: 'שגיאה ביצירת תצוגה מקדימה' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(action: 'send' | 'draft') {
    const recipientList = recipients.split(',').map((r) => r.trim()).filter(Boolean)
    if (recipientList.length === 0) {
      setResult({ status: 'error', message: 'נא להזין כתובות אימייל' })
      return
    }

    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          action,
          recipients: recipientList,
          subject: subject || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({
          status: 'success',
          message: action === 'send' ? 'האימייל נשלח בהצלחה!' : 'הטיוטה נשמרה ב-Outlook',
        })
      } else {
        setResult({ status: 'error', message: data.error || 'שגיאה בשליחת האימייל' })
      }
    } catch {
      setResult({ status: 'error', message: 'שגיאה בשליחת האימייל' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            אימייל עדכון - {clientName}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">נמענים (מופרדים בפסיקים)</label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email@example.com"
              dir="ltr"
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">נושא</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ייווצר אוטומטית אם ריק"
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
          </div>

          {!preview && !loading && (
            <button
              onClick={generatePreview}
              className="flex items-center gap-2 bg-knesset-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-900 w-full justify-center"
            >
              <FileText className="w-4 h-4" />
              צור תצוגה מקדימה
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              יוצר תוכן...
            </div>
          )}

          {preview && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-b">תצוגה מקדימה</div>
              <div
                className="p-4 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}

          {result && (
            <div className={`px-4 py-3 rounded-lg text-sm ${result.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {result.message}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="flex items-center gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={() => handleSend('send')}
              disabled={sending}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'שולח...' : 'שלח עכשיו'}
            </button>
            <button
              onClick={() => handleSend('draft')}
              disabled={sending}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              שמור כטיוטה
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
