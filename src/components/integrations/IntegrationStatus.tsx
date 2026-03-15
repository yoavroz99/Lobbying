'use client'

import { useEffect, useState } from 'react'
import { Link2, Unlink, Mail, HardDrive } from 'lucide-react'

interface IntegrationState {
  microsoft: { connected: boolean; connectedAt: string | null }
  google: { connected: boolean; connectedAt: string | null }
}

export default function IntegrationStatus() {
  const [status, setStatus] = useState<IntegrationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/integrations/status')
      if (res.ok) setStatus(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function disconnect(provider: 'microsoft' | 'google') {
    setDisconnecting(provider)
    try {
      await fetch(`/api/integrations/${provider}/disconnect`, { method: 'POST' })
      await fetchStatus()
    } catch {
      // ignore
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse h-20 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <h2 className="font-bold text-gray-800 flex items-center gap-2">
        <Link2 className="w-5 h-5 text-gray-400" />
        חיבורים חיצוניים
      </h2>

      {/* Microsoft Outlook */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Microsoft Outlook</p>
            <p className="text-xs text-gray-500">
              {status?.microsoft.connected
                ? `מחובר - שליחת אימיילי עדכון ללקוחות`
                : 'לא מחובר - חבר כדי לשלוח דייג׳סט באימייל'}
            </p>
          </div>
        </div>
        {status?.microsoft.connected ? (
          <button
            onClick={() => disconnect('microsoft')}
            disabled={disconnecting === 'microsoft'}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            <Unlink className="w-4 h-4" />
            {disconnecting === 'microsoft' ? 'מנתק...' : 'נתק'}
          </button>
        ) : (
          <a
            href="/api/integrations/microsoft/connect"
            className="flex items-center gap-1 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            <Link2 className="w-4 h-4" />
            חבר
          </a>
        )}
      </div>

      {/* Google Drive */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Google Drive</p>
            <p className="text-xs text-gray-500">
              {status?.google.connected
                ? `מחובר - AI לומד ממסמכי הלקוחות`
                : 'לא מחובר - חבר כדי לשלב מסמכים בכלי AI'}
            </p>
          </div>
        </div>
        {status?.google.connected ? (
          <button
            onClick={() => disconnect('google')}
            disabled={disconnecting === 'google'}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            <Unlink className="w-4 h-4" />
            {disconnecting === 'google' ? 'מנתק...' : 'נתק'}
          </button>
        ) : (
          <a
            href="/api/integrations/google/connect"
            className="flex items-center gap-1 text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            <Link2 className="w-4 h-4" />
            חבר
          </a>
        )}
      </div>
    </div>
  )
}
