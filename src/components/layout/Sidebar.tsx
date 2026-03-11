'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Globe,
  Sparkles,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  Shield,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { labels } from '@/lib/utils/hebrew'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: labels.nav.dashboard },
  { href: '/clients', icon: Users, label: labels.nav.clients },
  { href: '/dashboard/tasks', icon: ClipboardList, label: labels.nav.tasks },
  { href: '/dashboard/scraping', icon: Globe, label: labels.nav.scraping },
  { href: '/dashboard/ai', icon: Sparkles, label: labels.nav.ai },
  { href: '/profile', icon: User, label: labels.nav.profile },
  { href: '/admin', icon: Shield, label: 'ניהול שדלנים', adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = (session?.user as any)?.role === 'admin'

  const visibleNavItems = navItems.filter((item) => !(item as any).adminOnly || isAdmin)

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-knesset-blue text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-1">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-knesset-gold" />
          <span className="font-bold">{labels.app.name}</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-knesset-blue text-white z-50 transition-transform duration-300 flex flex-col',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-knesset-gold" />
              <div>
                <h1 className="text-lg font-bold">{labels.app.name}</h1>
                <p className="text-xs text-white/60">{labels.app.tagline}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                  isActive
                    ? 'bg-white/15 text-white border-l-3 border-knesset-gold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        {session?.user && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-knesset-gold/20 flex items-center justify-center text-knesset-gold font-bold text-sm">
                {session.user.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-white/50 truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{labels.nav.logout}</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 mobile-nav">
        <div className="flex justify-around py-2">
          {visibleNavItems.filter((i) => !(i as any).adminOnly).slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]',
                  isActive ? 'text-knesset-blue' : 'text-gray-400'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
