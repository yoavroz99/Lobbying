'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react'

interface DriveFolder {
  id: string
  folderId: string
  folderName: string
  lastSyncedAt: string | null
  _count?: { documents: number }
}

interface DriveFolderManagerProps {
  clientId: string
  googleConnected: boolean
}

export default function DriveFolderManager({ clientId, googleConnected }: DriveFolderManagerProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [folderInput, setFolderInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (googleConnected) loadFolders()
    else setLoading(false)
  }, [clientId, googleConnected])

  async function loadFolders() {
    try {
      const res = await fetch(`/api/drive/folders?clientId=${clientId}`)
      if (res.ok) setFolders(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function addFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!folderInput.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, folderId: folderInput.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setFolderInput('')
        setShowAdd(false)
        await loadFolders()
      } else {
        setError(data.error || 'שגיאה בהוספת תיקייה')
      }
    } catch {
      setError('שגיאה בהוספת תיקייה')
    } finally {
      setAdding(false)
    }
  }

  async function removeFolder(id: string) {
    try {
      await fetch(`/api/drive/folders?id=${id}`, { method: 'DELETE' })
      await loadFolders()
    } catch {
      // ignore
    }
  }

  async function syncFolder(id: string) {
    setSyncing(id)
    try {
      await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: id }),
      })
      await loadFolders()
    } catch {
      // ignore
    } finally {
      setSyncing(null)
    }
  }

  if (!googleConnected) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <FolderOpen className="w-5 h-5 text-green-600" />
          תיקיות Google Drive
        </h2>
        <p className="text-sm text-gray-500">
          חבר את Google Drive בדף הפרופיל כדי לקשר תיקיות ללקוח ולהעשיר את כלי ה-AI במסמכים.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="animate-pulse h-16 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-green-600" />
          תיקיות Google Drive ({folders.length})
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-sm text-green-600 hover:underline"
        >
          <Plus className="w-4 h-4" />
          הוסף תיקייה
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addFolder} className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <input
            type="text"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder="הדבק קישור או מזהה תיקייה מ-Google Drive"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg border text-sm"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {adding ? 'מוסיף...' : 'הוסף'}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500 text-sm">
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {folders.map((folder) => (
          <div key={folder.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">{folder.folderName}</p>
              <p className="text-xs text-gray-400">
                {folder._count?.documents || 0} מסמכים
                {folder.lastSyncedAt && ` • סונכרן לאחרונה: ${new Date(folder.lastSyncedAt).toLocaleDateString('he-IL')}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => syncFolder(folder.id)}
                disabled={syncing === folder.id}
                className="p-2 text-gray-400 hover:text-green-600 rounded"
                title="סנכרן"
              >
                {syncing === folder.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => removeFolder(folder.id)}
                className="p-2 text-gray-400 hover:text-red-600 rounded"
                title="הסר"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {folders.length === 0 && (
          <p className="text-center text-gray-400 py-3 text-sm">אין תיקיות מקושרות</p>
        )}
      </div>
    </div>
  )
}
