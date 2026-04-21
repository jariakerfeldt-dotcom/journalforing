import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Receipt,
  Plus,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems: Array<{
  to: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}> = [
  { to: '/', label: 'Översikt', icon: LayoutDashboard, exact: true },
  { to: '/kunder', label: 'Kunder', icon: Users },
  { to: '/behandlingar', label: 'Behandlingar', icon: ClipboardList },
  { to: '/fakturor', label: 'Fakturor', icon: Receipt },
]

function HorseshoeMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      aria-hidden
    >
      <path
        d="M9 6.5C9 6.5 6 9 6 14.5C6 20 9 24 16 24C23 24 26 20 26 14.5C26 9 23 6.5 23 6.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="9" cy="6.5" r="1.4" fill="currentColor" />
      <circle cx="23" cy="6.5" r="1.4" fill="currentColor" />
      <circle cx="7.4" cy="11" r="1" fill="currentColor" />
      <circle cx="24.6" cy="11" r="1" fill="currentColor" />
      <circle cx="7" cy="16" r="1" fill="currentColor" />
      <circle cx="25" cy="16" r="1" fill="currentColor" />
      <circle cx="8.5" cy="20.5" r="1" fill="currentColor" />
      <circle cx="23.5" cy="20.5" r="1" fill="currentColor" />
    </svg>
  )
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 px-2 py-1 rounded-lg text-stone-900 hover:bg-stone-100 transition-colors"
    >
      <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-700 text-white">
        <HorseshoeMark />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">Hovjournal</span>
        <span className="text-[11px] text-stone-500 font-medium">
          Journal & fakturering
        </span>
      </div>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { location } = useRouterState()
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? location.pathname === item.to
          : location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200'
                : 'text-stone-700 hover:bg-stone-100',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-stone-200 lg:bg-white lg:sticky lg:top-0 lg:h-screen">
        <div className="px-4 py-5 border-b border-stone-100">
          <Brand />
        </div>
        <div className="flex-1 p-3">
          <NavList />
        </div>
        <div className="p-3 border-t border-stone-100">
          <Link
            to="/behandlingar/ny"
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-700 text-white h-10 px-4 text-sm font-medium hover:bg-amber-800 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Ny behandling
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100"
            aria-label="Öppna meny"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen ? (
          <div className="px-4 pb-4 border-b border-stone-200">
            <NavList onNavigate={() => setMobileOpen(false)} />
            <Link
              to="/behandlingar/ny"
              onClick={() => setMobileOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-700 text-white h-10 px-4 text-sm font-medium hover:bg-amber-800"
            >
              <Plus className="h-4 w-4" />
              Ny behandling
            </Link>
          </div>
        ) : null}
      </header>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {children}
    </div>
  )
}
