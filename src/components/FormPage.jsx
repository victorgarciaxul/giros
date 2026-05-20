import { useState, useEffect } from 'react'
import { saveSubmission, isConfigured, getShareableLink, loadFormConfig } from '../lib/github'

const DRAFT_KEY = 'giros_draft'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function getFieldIcon(field) {
  if (field.category === 'luces') {
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  }
  if (field.category === 'sombras') {
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )
  }
  if (field.type === 'email') {
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  }
  if (field.key === 'nombre') {
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
  if (field.key === 'proyecto') {
    return (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  }
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

export default function FormPage({ setPage, isPublic = false }) {
  const [formFields, setFormFields] = useState([])
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [fields, setFields] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [editId, setEditId] = useState(null)
  const [sentId, setSentId] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const configured = isConfigured()

  useEffect(() => {
    async function initForm() {
      setLoadingConfig(true)
      try {
        const cfg = await loadFormConfig()
        setFormFields(cfg)
        
        // Build initial fields layout
        const initial = {}
        cfg.forEach(f => {
          initial[f.key] = ''
        })

        // Check for drafts
        const draft = localStorage.getItem(DRAFT_KEY)
        if (draft) {
          try {
            const parsed = JSON.parse(draft)
            const merged = { ...initial }
            if (parsed.fields) {
              Object.keys(parsed.fields).forEach(k => {
                if (k in merged) merged[k] = parsed.fields[k]
              })
            }
            setFields(merged)
            setEditId(parsed.id || null)
          } catch {
            setFields(initial)
          }
        } else {
          setFields(initial)
        }
      } catch (e) {
        console.error('Error initializing form fields:', e)
      } finally {
        setLoadingConfig(false)
      }
    }
    initForm()
  }, [])

  useEffect(() => {
    if (!showSuccess && formFields.length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ id: editId, fields }))
    }
  }, [fields, editId, showSuccess, formFields])

  function set(key, val) {
    setFields(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function validate() {
    const errs = {}
    formFields.forEach(f => {
      if (f.required && !(fields[f.key] || '').trim()) {
        errs[f.key] = 'Este campo es obligatorio'
      }
      if (f.type === 'email' && fields[f.key]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields[f.key])) {
          errs[f.key] = 'Ingresá un correo válido'
        }
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSave(status = 'sent') {
    if (!validate()) return
    if (!configured) {
      showToast('Error de conexión con la base de datos', 'error')
      return
    }
    setSaving(true)
    try {
      const id = editId || genId()
      const submission = {
        id,
        createdAt: new Date().toISOString(),
        status,
        ...fields,
      }
      await saveSubmission(submission)
      setEditId(id)
      
      if (status === 'sent') {
        setSentId(id)
        setShowSuccess(true)
        localStorage.removeItem(DRAFT_KEY)
      } else {
        showToast('Borrador guardado correctamente', 'success')
      }
    } catch (e) {
      showToast('Error al procesar: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleShareForm() {
    const url = getShareableLink('form')
    navigator.clipboard.writeText(url)
    showToast('Enlace del formulario copiado al portapapeles', 'success')
  }

  function handleNew() {
    const cleared = {}
    formFields.forEach(f => { cleared[f.key] = '' })
    setFields(cleared)
    setEditId(null)
    setErrors({})
    localStorage.removeItem(DRAFT_KEY)
  }

  const hasDraft = Object.values(fields).some(v => (v || '').trim())

  if (loadingConfig) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 4 }} />
        <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Cargando estructura del formulario...</p>
      </div>
    )
  }

  if (showSuccess) {
    const shareUrl = getShareableLink('submission', sentId)
    
    const handleCopyShareUrl = () => {
      navigator.clipboard.writeText(shareUrl)
      showToast('Enlace de compartir copiado al portapapeles', 'success')
    }

    const handleCreateAnother = () => {
      const cleared = {}
      formFields.forEach(f => { cleared[f.key] = '' })
      setFields(cleared)
      setEditId(null)
      setSentId(null)
      setShowSuccess(false)
      setErrors({})
    }

    return (
      <>
        <div className="page-header">
          <div>
            <h2>¡Aprendizaje Cosechado!</h2>
            <p>Tu aprendizaje fue enviado con éxito</p>
          </div>
        </div>
        
        <div className="page-content" style={{ maxWidth: 680 }}>
          {toast && (
            <div className={`alert alert-${toast.type}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {toast.msg}
            </div>
          )}

          <div className="card" style={{ borderTop: '6px solid var(--success)' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '40px 32px' }}>
              <div style={{ color: 'var(--success)', marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 64, height: 64, animation: 'float 4s ease-in-out infinite' }}>
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12 }}>¡Aprendizaje enviado al equipo!</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28, fontSize: 14.5 }}>
                Tu aprendizaje ha sido registrado con estado <strong>Enviado</strong>. Compartilo con tus compañeros de equipo a través de este enlace directo:
              </p>
              
              <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  style={{ background: '#f8fafc', border: '1.5px solid var(--border)', fontFamily: 'monospace', fontSize: 13, cursor: 'text' }}
                  onClick={e => e.target.select()}
                />
                <button className="btn btn-primary" onClick={handleCopyShareUrl} style={{ gap: 6 }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copiar Enlace
                </button>
              </div>

              <div className="btn-row" style={{ justifyContent: 'center', gap: 16 }}>
                {!isPublic && (
                  <button className="btn btn-ghost" onClick={() => setPage('dashboard')}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Ver listado de aprendizajes
                  </button>
                )}
                <button className="btn btn-success" onClick={handleCreateAnother}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Cargar otro aprendizaje
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>{editId ? 'Editar registro' : 'Nuevo registro'}</h2>
          <p>Cosecha de aprendizajes para GIROS</p>
        </div>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleShareForm} style={{ gap: 6 }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922-.641m0 0a3 3 0 10-2.28 4.302m0-4.302a3 3 0 002.28-4.302m1.922 6.224l1.922.641m0 0a3 3 0 102.28-4.302m-2.28 4.302a3 3 0 00-2.28 4.302" />
            </svg>
            Compartir Formulario
          </button>
          {hasDraft && (
            <button className="btn btn-ghost btn-sm" onClick={handleNew}>
              Limpiar formulario
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="banner-wind">
          <div className="banner-wind-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
            </svg>
          </div>
          <div className="banner-wind-content">
            <h4>¿Qué hacemos cuando el viento cambia?</h4>
            <p>
              Este espacio bimensual nos invita a compartir aprendizajes de cada proyecto que puedan inspirar y servir al resto del equipo. Un momento para reflexionar juntxs, adaptarnos y potenciar nuestras prácticas.
            </p>
          </div>
        </div>


        {toast && (
          <div className={`alert alert-${toast.type}`}>
            {toast.type === 'success' ? (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.msg}
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <div className="form-grid">
              {formFields.map(f => {
                const labelStyle = f.category === 'luces' ? { color: 'var(--success)' } : f.category === 'sombras' ? { color: 'var(--warning)' } : {}
                const groupCls = `form-group${f.category === 'luces' ? ' form-group-luces' : f.category === 'sombras' ? ' form-group-sombras' : ''}`
                
                // Textareas take full width
                const style = f.type === 'textarea' ? { gridColumn: '1 / -1' } : {}

                return (
                  <div key={f.key} className={groupCls} style={style}>
                    <label style={labelStyle}>
                      {getFieldIcon(f)}
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
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleSave('sent')}
                  disabled={saving}
                  style={{ gap: 8 }}
                >
                  {saving ? <><span className="spinner" /> Enviando...</> : (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Enviar Aprendizaje
                    </>
                  )}
                </button>

                <button
                  className="btn btn-ghost btn-lg"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  style={{ gap: 8 }}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Guardar Borrador
                </button>
              </div>

              {editId && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, gridColumn: '1 / -1' }}>
                  ID del registro activo: <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{editId}</code>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
