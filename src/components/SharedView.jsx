import { useState, useEffect } from 'react'
import { loadSubmissions, isConfigured, loadFormConfig, saveSubmission } from '../lib/github'

function FillDraftForm({ submission, formFields, onSubmitted }) {
  const [fields, setFields] = useState(() => {
    const init = {}
    formFields.forEach(f => { init[f.key] = submission[f.key] || '' })
    return init
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function set(key, val) {
    setFields(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function validate() {
    const errs = {}
    formFields.forEach(f => {
      if (f.required && !(fields[f.key] || '').trim()) errs[f.key] = 'Este campo es obligatorio'
      if (f.type === 'email' && fields[f.key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields[f.key])) {
        errs[f.key] = 'Ingresá un correo válido'
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      await saveSubmission({ id: submission.id, createdAt: submission.createdAt, status: 'sent', ...fields })
      onSubmitted()
    } catch (e) {
      alert('Error al enviar: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 800, width: '100%' }}>
        <div className="banner-wind" style={{ marginBottom: 32 }}>
          <div className="banner-wind-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
            </svg>
          </div>
          <div className="banner-wind-content">
            <h4>¿Qué hacemos cuando el viento cambia?</h4>
            <p>Este espacio nos invita a compartir aprendizajes de cada proyecto que puedan inspirar y servir al resto del equipo.</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="form-grid">
              {formFields.map(f => {
                const labelStyle = f.category === 'luces' ? { color: 'var(--success)' } : f.category === 'sombras' ? { color: 'var(--warning)' } : {}
                const groupCls = `form-group${f.category === 'luces' ? ' form-group-luces' : f.category === 'sombras' ? ' form-group-sombras' : ''}`
                const style = f.type === 'textarea' ? { gridColumn: '1 / -1' } : {}
                return (
                  <div key={f.key} className={groupCls} style={style}>
                    <label style={labelStyle}>
                      {f.label} {f.required && <span className="required">*</span>}
                    </label>
                    {f.hint && <span className="hint">{f.hint}</span>}
                    {f.type === 'textarea' ? (
                      <textarea
                        className={`tall${errors[f.key] ? ' error' : ''}`}
                        value={fields[f.key] || ''}
                        onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                      />
                    ) : (
                      <input
                        type={f.type || 'text'}
                        value={fields[f.key] || ''}
                        onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className={errors[f.key] ? 'error' : ''}
                      />
                    )}
                    {errors[f.key] && (
                      <span className="field-error">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {errors[f.key]}
                      </span>
                    )}
                  </div>
                )
              })}

              <div className="divider" style={{ margin: '8px 0', gridColumn: '1 / -1' }} />
              <div className="btn-row" style={{ gridColumn: '1 / -1' }}>
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving} style={{ gap: 8 }}>
                  {saving ? <><span className="spinner" /> Enviando...</> : (
                    <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Enviar Aprendizaje</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SharedView({ id, setPage }) {
  const [submission, setSubmission] = useState(null)
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const configured = isConfigured()

  useEffect(() => {
    async function load() {
      if (!configured) { setLoading(false); return }
      try {
        const [data, fieldsConfig] = await Promise.all([loadSubmissions(), loadFormConfig()])
        setFormFields(fieldsConfig)
        const found = data.find(s => s.id === id)
        if (found) setSubmission(found)
        else setError('El formulario solicitado no existe o fue eliminado.')
      } catch (e) {
        setError('Error al cargar el formulario: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, configured])

  function handleGoTo(targetPage) {
    window.history.pushState({}, '', window.location.pathname)
    setPage(targetPage)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <span className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 4 }} />
        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 15 }}>Cargando formulario...</p>
      </div>
    )
  }

  if (!configured || error || !submission) {
    return (
      <div className="page-content" style={{ maxWidth: 600, margin: '60px auto' }}>
        <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Formulario no encontrado</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              {error || 'No pudimos encontrar el formulario solicitado.'}
            </p>
            <button className="btn btn-ghost" onClick={() => handleGoTo('dashboard')}>Ir al Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  // Draft → show fillable form
  if (submission.status === 'draft') {
    if (submitted) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 40, textAlign: 'center' }}>
          <div style={{ color: 'var(--success)', marginBottom: 20 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 64, height: 64 }}>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 10 }}>¡Aprendizaje enviado!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Gracias por compartir tu cosecha de aprendizajes.</p>
        </div>
      )
    }
    return <FillDraftForm submission={submission} formFields={formFields} onSubmitted={() => setSubmitted(true)} />
  }

  // Sent → read-only view
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
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 800 }}>
        <div className="card" style={{ borderTop: '6px solid var(--primary)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)' }}>{submission[projectField.key] || 'Proyecto'}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Cosechado por <strong>{submission[nameField.key] || 'Colaborador'}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-sent" style={{ padding: '6px 14px' }}>Enviado al equipo</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>

            {formFields.map(f => {
              if (f.key === 'nombre' || f.key === 'proyecto') return null
              if (!submission[f.key]) return null
              const isLuces = f.category === 'luces'
              const isSombras = f.category === 'sombras'
              return (
                <div key={f.key} className={`detail-field${isLuces ? ' detail-field-luces' : isSombras ? ' detail-field-sombras' : ''}`} style={{ marginTop: 24 }}>
                  <label style={isLuces ? { color: 'var(--success)' } : isSombras ? { color: 'var(--warning)' } : {}}>{f.label}</label>
                  <p>{submission[f.key]}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
