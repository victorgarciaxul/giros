import { useState, useEffect } from 'react'
import { loadSubmissions, isConfigured, loadFormConfig } from '../lib/github'

export default function SharedView({ id, setPage }) {
  const [submission, setSubmission] = useState(null)
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const configured = isConfigured()

  useEffect(() => {
    async function load() {
      if (!configured) {
        setLoading(false)
        return
      }
      try {
        const [data, fieldsConfig] = await Promise.all([
          loadSubmissions(),
          loadFormConfig()
        ])
        setFormFields(fieldsConfig)
        const found = data.find(s => s.id === id)
        if (found) {
          setSubmission(found)
        } else {
          setError('El aprendizaje solicitado no existe o fue eliminado.')
        }
      } catch (e) {
        setError('Error al cargar el aprendizaje: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, configured])

  function handleGoTo(targetPage) {
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname)
    setPage(targetPage)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <span className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 4 }} />
        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 15 }}>Cargando aprendizaje compartido...</p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="page-content" style={{ maxWidth: 600, margin: '60px auto' }}>
        <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ color: 'var(--warning)', marginBottom: 20 }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ width: 56, height: 56 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>No se pudo conectar</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              No se pudo establecer conexión con la base de datos para cargar este aprendizaje.
            </p>
            <button className="btn btn-ghost" onClick={() => handleGoTo('dashboard')}>
              Ir al listado general
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="page-content" style={{ maxWidth: 600, margin: '60px auto' }}>
        <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 20 }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ width: 56, height: 56 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Aprendizaje no encontrado</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              {error || 'No pudimos encontrar el registro solicitado.'}
            </p>
            <button className="btn btn-ghost" onClick={() => handleGoTo('dashboard')}>
              Ir al listado general
            </button>
          </div>
        </div>
      </div>
    )
  }

  const nameField = formFields.find(f => f.key === 'nombre') || { key: 'nombre', label: 'Nombre' }
  const projectField = formFields.find(f => f.key === 'proyecto') || { key: 'proyecto', label: 'Proyecto' }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Aprendizaje Compartido</h2>
          <p>Cosecha de GIROS — {submission[projectField.key] || ''}</p>
        </div>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => handleGoTo('dashboard')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Ver listado
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleGoTo('form')}>
            Crear registro
          </button>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 800 }}>
        <div className="card" style={{ borderTop: '6px solid var(--primary)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)' }}>
                  {submission[projectField.key] || 'Proyecto'}
                </h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Cosechado por <strong>{submission[nameField.key] || 'Colaborador'}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-sent" style={{ padding: '6px 14px' }}>Enviado al equipo</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {submission.createdAt
                    ? new Date(submission.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
              </div>
            </div>

            {formFields.map(f => {
              if (f.key === 'nombre' || f.key === 'proyecto') return null // Shown in header
              if (!submission[f.key]) return null
              
              const isLuces = f.category === 'luces'
              const isSombras = f.category === 'sombras'
              const fieldCls = `detail-field${isLuces ? ' detail-field-luces' : isSombras ? ' detail-field-sombras' : ''}`
              const labelStyle = isLuces ? { color: 'var(--success)' } : isSombras ? { color: 'var(--warning)' } : {}

              return (
                <div key={f.key} className={fieldCls} style={{ marginTop: 24 }}>
                  <label style={labelStyle}>{f.label}</label>
                  <p style={f.key === 'comentarios' ? { background: 'var(--bg)' } : {}}>{submission[f.key]}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
