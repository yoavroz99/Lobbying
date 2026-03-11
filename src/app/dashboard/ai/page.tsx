'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sparkles,
  ClipboardList,
  FileText,
  Target,
  Search,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { labels } from '@/lib/utils/hebrew'

const AI_TOOLS = [
  {
    type: 'summarize',
    icon: ClipboardList,
    title: 'סיכום דיון ועדה',
    description: 'סכם דיון של ועדת כנסת בצורה תמציתית ומקצועית',
    placeholder: 'הדבק כאן את תוכן הדיון או תאר את הנושא...\n\nלדוגמה:\nועדת הכלכלה דנה היום בהצעת חוק להגבלת מחירי הדיור...',
  },
  {
    type: 'letter',
    icon: FileText,
    title: 'כתיבת מכתב',
    description: 'כתוב מכתב רשמי לנבחר ציבור או פקיד ממשלתי',
    placeholder: 'תאר את המכתב הנדרש...\n\nלדוגמה:\nמכתב לשר האוצר בנושא הטבות מס לתעשיית ההייטק.\nלקוח: חברת טכנולוגיה גדולה.\nהבקשה: הארכת הטבות המס לעוד 5 שנים.',
  },
  {
    type: 'strategy',
    icon: Target,
    title: 'תוכנית אסטרטגית',
    description: 'צור תוכנית אסטרטגית להשפעה על מדיניות',
    placeholder: 'תאר את המטרה האסטרטגית...\n\nלדוגמה:\nהלקוח הוא ארגון סביבתי שרוצה לקדם חקיקה\nלהגבלת פליטות פחמן בתעשייה.\nהמטרה: העברת חוק בכנסת תוך שנה.',
  },
  {
    type: 'analyze',
    icon: Search,
    title: 'ניתוח מידע',
    description: 'נתח מידע מהכנסת או הממשלה וזהה השלכות',
    placeholder: 'הדבק את המידע לניתוח...\n\nלדוגמה:\nהממשלה אישרה תקציב של 2 מיליארד ש"ח\nלפיתוח תשתיות תחבורה ציבורית...',
  },
]

export default function AIPage() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'summarize'
  const clientId = searchParams.get('clientId') || ''

  const [selectedTool, setSelectedTool] = useState(initialType)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState(clientId)

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then((c) => setClients(Array.isArray(c) ? c : []))
    fetch('/api/ai').then((r) => r.json()).then((h) => setHistory(Array.isArray(h) ? h : []))
  }, [])

  const tool = AI_TOOLS.find((t) => t.type === selectedTool) || AI_TOOLS[0]

  async function generate() {
    if (!prompt.trim()) return
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedTool,
          prompt: selectedClientId
            ? `לקוח: ${clients.find((c: any) => c.id === selectedClientId)?.name || ''}\n\n${prompt}`
            : prompt,
          clientId: selectedClientId || undefined,
        }),
      })
      const data = await res.json()
      setResponse(data.response || data.error || 'שגיאה')
      // Refresh history
      fetch('/api/ai').then((r) => r.json()).then((h) => setHistory(Array.isArray(h) ? h : []))
    } catch {
      setResponse('שגיאה בהתחברות לשרת')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-knesset-gold" />
          כלי AI
        </h1>
        <p className="text-gray-500 mt-1">כלים מבוססי בינה מלאכותית לעבודת השדלנות</p>
      </div>

      {/* Tool Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {AI_TOOLS.map((t) => (
          <button
            key={t.type}
            onClick={() => { setSelectedTool(t.type); setResponse('') }}
            className={cn(
              'p-4 rounded-xl border text-right transition-all',
              selectedTool === t.type
                ? 'border-knesset-blue bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <t.icon className={cn(
              'w-6 h-6 mb-2',
              selectedTool === t.type ? 'text-knesset-blue' : 'text-gray-400'
            )} />
            <p className="font-medium text-sm">{t.title}</p>
            <p className="text-xs text-gray-400 mt-1 hidden lg:block">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-bold text-gray-900 mb-1">{tool.title}</h2>
        <p className="text-sm text-gray-500 mb-4">{tool.description}</p>

        {/* Client selector */}
        <div className="mb-4">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
          >
            <option value="">ללא שיוך ללקוח</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={tool.placeholder}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-knesset-blue focus:border-transparent outline-none text-sm min-h-[160px] resize-y"
          dir="rtl"
        />

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 bg-knesset-blue text-white px-6 py-2.5 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {labels.ai.generating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {labels.actions.generate}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-knesset-gold" />
              תוצאה
            </h3>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'הועתק' : 'העתק'}
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {response}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-900 mb-4">היסטוריית בקשות</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.slice(0, 10).map((req: any) => (
              <button
                key={req.id}
                onClick={() => {
                  setSelectedTool(req.type)
                  setPrompt(req.prompt)
                  if (req.response) setResponse(req.response)
                }}
                className="w-full text-right p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {labels.task.types[req.type as keyof typeof labels.task.types] || req.type}
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    req.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  )}>
                    {req.status === 'completed' ? 'הושלם' : 'בתהליך'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">{req.prompt}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
