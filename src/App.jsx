import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import FormPage from './components/FormPage'
import Dashboard from './components/Dashboard'
import FormEditor from './components/FormEditor'
import Settings from './components/Settings'
import SharedView from './components/SharedView'

export default function App() {
  const [page, setPage] = useState('dashboard') // Default is dashboard
  const [sharedId, setSharedId] = useState(null)
  const [isPublicForm, setIsPublicForm] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    
    // Parse config from URL if present
    const o = params.get('o')
    const r = params.get('r')
    const b = params.get('b')
    const p = params.get('p')
    const t = params.get('t')
    if (o && r && t) {
      try {
        const config = {
          owner: o,
          repo: r,
          branch: b || 'main',
          filepath: p || 'data/submissions.json',
          token: atob(t)
        }
        localStorage.setItem('giros_github_config', JSON.stringify(config))
      } catch (e) {
        console.error('Error loading config from URL:', e)
      }
    }

    const fill = params.get('fill')
    const id = params.get('id')

    if (fill === 'true') {
      setIsPublicForm(true)
      setPage('form')
    } else if (id) {
      setSharedId(id)
      setPage('shared')
    } else {
      setPage('dashboard')
    }
  }, [])

  if (isPublicForm) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 20px', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ maxWidth: 800, width: '100%' }}>
          <FormPage setPage={setPage} isPublic={true} />
        </div>
      </div>
    )
  }

  return (
    <Layout page={page} setPage={setPage}>
      {page === 'form'      && <FormPage setPage={setPage} isPublic={false} />}
      {page === 'dashboard' && <Dashboard setPage={setPage} />}
      {page === 'editor'    && <FormEditor setPage={setPage} />}
      {page === 'settings'  && <Settings />}
      {page === 'shared'    && <SharedView id={sharedId} setPage={setPage} />}
    </Layout>
  )
}
