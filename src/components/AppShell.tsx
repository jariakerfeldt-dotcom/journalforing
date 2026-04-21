import { Link, useRouterState } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto', className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-stone-600 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const NAV = [
  { to: '/', label: 'Översikt', icon: '🏠', exact: true },
  { to: '/journalforing', label: 'Journalföring', icon: '📋' },
  { to: '/kunder', label: 'Kunder', icon: '👥' },
  { to: '/hastar', label: 'Hästar', icon: '🐎' },
  { to: '/fakturor', label: 'Fakturor', icon: '📄' },
  { to: '/produkter', label: 'Produkter', icon: '🛒' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  function isActive(to: string, exact?: boolean) {
    return exact ? pathname === to : pathname.startsWith(to);
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR – desktop */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-horse">🐴</span>
          <div>
            <div className="logo-title">Hovjournal</div>
            <div className="logo-sub">Journal & fakturering</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-group-label">Översikt</div>
          <Link to="/" className={`nav-item ${isActive('/', true) ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span> Översikt
          </Link>

          <div className="nav-group-label" style={{ marginTop: 16 }}>Arbete</div>
          <Link to="/journalforing" className={`nav-item ${isActive('/journalforing') ? 'active' : ''}`}>
            <span className="nav-icon">📋</span> Journalföring
          </Link>
          <Link to="/kunder" className={`nav-item ${isActive('/kunder') ? 'active' : ''}`}>
            <span className="nav-icon">👥</span> Kunder
          </Link>
          <Link to="/hastar" className={`nav-item ${isActive('/hastar') ? 'active' : ''}`}>
            <span className="nav-icon">🐎</span> Hästar
          </Link>

          <div className="nav-group-label" style={{ marginTop: 16 }}>Ekonomi</div>
          <Link to="/fakturor" className={`nav-item ${isActive('/fakturor') ? 'active' : ''}`}>
            <span className="nav-icon">📄</span> Fakturor
          </Link>
          <Link to="/produkter" className={`nav-item ${isActive('/produkter') ? 'active' : ''}`}>
            <span className="nav-icon">🛒</span> Produkter
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">H</div>
            <div>
              <div className="user-name">Hovslagare</div>
              <div className="user-role">Inloggad</div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILHEADER */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setMobileOpen(true)}>☰</button>
        <span className="mobile-logo">🐴 Hovjournal</span>
        <Link to="/journalforing/ny" className="mobile-add">+</Link>
      </div>

      {/* MOBIL DRAWER */}
      {mobileOpen && (
        <div className="drawer-overlay" onClick={() => setMobileOpen(false)}>
          <nav className="drawer" onClick={e => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setMobileOpen(false)}>✕</button>
            {NAV.map(n => (
              <Link key={n.to} to={n.to} className={`drawer-item ${isActive(n.to, n.exact) ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                <span>{n.icon}</span> {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* INNEHÅLL */}
      <main className="main-content">
        {children}
      </main>

      {/* MOBILNAVBAR (bottom) */}
      <nav className="mobile-nav">
        {NAV.slice(0, 5).map(n => (
          <Link key={n.to} to={n.to} className={`mobile-nav-item ${isActive(n.to, n.exact) ? 'active' : ''}`}>
            <span className="mobile-nav-icon">{n.icon}</span>
            <span className="mobile-nav-label">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
