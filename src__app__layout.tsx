import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: 'לוביסט פרו - מערכת ניהול שדלנות',
  description: 'מערכת ניהול שדלנות מקצועית לעבודה מול הכנסת והממשלה',
  manifest: '/manifest.json',
  themeColor: '#003366',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
