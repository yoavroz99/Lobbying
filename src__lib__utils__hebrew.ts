// Hebrew translations and labels used across the app

export const labels = {
  app: {
    name: 'לוביסט פרו',
    tagline: 'מערכת ניהול שדלנות',
  },
  nav: {
    dashboard: 'לוח בקרה',
    clients: 'לקוחות',
    tasks: 'משימות',
    scraping: 'מעקב מידע',
    ai: 'כלי AI',
    profile: 'פרופיל',
    logout: 'התנתקות',
    login: 'התחברות',
  },
  task: {
    types: {
      summary: 'סיכום דיון',
      letter: 'כתיבת מכתב',
      strategy: 'תוכנית אסטרטגית',
      research: 'מחקר',
      general: 'כללי',
    },
    statuses: {
      pending: 'ממתין',
      in_progress: 'בביצוע',
      completed: 'הושלם',
      archived: 'בארכיון',
    },
    priorities: {
      low: 'נמוכה',
      medium: 'בינונית',
      high: 'גבוהה',
      urgent: 'דחוף',
    },
  },
  client: {
    statuses: {
      active: 'פעיל',
      inactive: 'לא פעיל',
      archived: 'בארכיון',
    },
  },
  scrape: {
    sources: {
      knesset_committee: 'ועדות הכנסת',
      knesset_plenum: 'מליאת הכנסת',
      gov_decision: 'החלטות ממשלה',
      legislation: 'חקיקה',
    },
  },
  user: {
    roles: {
      admin: 'מנהל',
      lobbyist: 'שדלן',
      viewer: 'צופה',
    },
  },
  actions: {
    save: 'שמירה',
    cancel: 'ביטול',
    delete: 'מחיקה',
    edit: 'עריכה',
    create: 'יצירה',
    add: 'הוספה',
    search: 'חיפוש',
    filter: 'סינון',
    generate: 'הפקה',
    send: 'שליחה',
    close: 'סגירה',
  },
  ai: {
    summarize: 'סכם דיון',
    writeLetter: 'כתוב מכתב',
    createStrategy: 'צור תוכנית אסטרטגית',
    analyze: 'נתח מידע',
    generating: 'מייצר תוכן...',
  },
} as const

export const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
}

export function formatHebrewDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'היום'
  if (diffDays === 1) return 'אתמול'
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`
  return formatHebrewDate(d)
}
