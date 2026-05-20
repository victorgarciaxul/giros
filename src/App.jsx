import { useState } from 'react'
import Layout from './components/Layout'
import FormPage from './components/FormPage'
import Dashboard from './components/Dashboard'
import FormEditor from './components/FormEditor'
import Settings from './components/Settings'
import SharedView from './components/SharedView'
import LoginPage from './components/LoginPage'

const SESSION_KEY = 'giros_session'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) } catch { return null }
  })

  // Detect public URL params synchronously to avoid login flash
  const [page, setPage] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('fill') === 'true') return 'form'
    if (p.get('id')) return 'shared'
    return 'dashboard'
  })
  const [sharedId, setSharedId] = useState(() => {
    return new URLSearchParams(window.location.search).get('id') || null
  })
  const [isPublicForm, setIsPublicForm] = useState(() => {
    return new URLSearchParams(window.location.search).get('fill') === 'true'
  })

  function handleLogin(userData) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData))
    setUser(userData)
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }


  if (!user && !isPublicForm) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (isPublicForm) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', width: '100%' }}>
        {/* Public form header */}
        <div style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0d9488 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: 15 }}>GIROS</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>Cosecha de aprendizajes · XUL</span>
          </div>
        </div>
        <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 800, width: '100%' }}>
            <FormPage setPage={setPage} isPublic={true} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout page={page} setPage={setPage} user={user} onLogout={handleLogout}>
      {page === 'form'      && <FormPage setPage={setPage} isPublic={false} />}
      {page === 'dashboard' && <Dashboard setPage={setPage} />}
      {page === 'editor'    && <FormEditor setPage={setPage} />}
      {page === 'settings'  && <Settings />}
      {page === 'shared'    && <SharedView id={sharedId} setPage={setPage} />}
    </Layout>
  )
}
