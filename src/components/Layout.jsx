const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: 'editor',
    label: 'Formularios',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'media',
    label: 'Media',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
  },
]

export default function Layout({ page, setPage, children, user, onLogout }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 22, height: 22, flexShrink: 0 }}>
              <circle cx="20" cy="20" r="7" stroke="var(--xul-red)" strokeWidth="2.5" fill="none" />
              <path d="M20 6 C28 6, 34 12, 34 20" stroke="var(--xul-red)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M34 20 C34 28, 28 34, 20 34" stroke="var(--xul-red)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M20 34 C12 34, 6 28, 6 20" stroke="var(--xul-red)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M6 20 C6 12, 12 6, 20 6" stroke="rgba(192,49,43,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4" fill="none" />
              <path d="M17 4.5 L20 6 L23 4.5" stroke="var(--xul-red)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span>GIROS</span>
          </h1>
          <p>Ciclo de encuentros · XUL</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.filter(item => user?.role !== 'guest' || item.id === 'media').map(item => (
            <button
              key={item.id}
              className={`nav-item${page === item.id ? ' active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {user && (
            <span style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>XUL © 2026</span>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--xul-red)'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
