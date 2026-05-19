import { useState, useEffect } from 'react'
import { loadFormConfig, saveFormConfig, isConfigured } from '../lib/github'

export default function FormEditor({ setPage }) {
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const configured = isConfigured()

  useEffect(() => {
    async function loadFields() {
      setLoading(true)
      try {
        const fields = await loadFormConfig()
        setFormFields(fields)
      } catch (e) {
        setError('Error al cargar la estructura del formulario: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    loadFields()
  }, [])

  function handleFieldChange(index, key, value) {
    const updated = [...formFields]
    updated[index] = { ...updated[index], [key]: value }
    setFormFields(updated)
    setSaved(false)
  }

  function handleAddField() {
    const newKey = 'campo_' + Math.random().toString(36).slice(2, 7)
    setFormFields(prev => [
      ...prev,
      {
        key: newKey,
        label: 'Nueva pregunta',
        type: 'textarea',
        required: false,
        placeholder: '',
        hint: '',
        category: 'standard'
      }
    ])
    setSaved(false)
  }

  function handleRemoveField(index) {
    const field = formFields[index]
    if (['correo', 'nombre', 'proyecto'].includes(field.key)) {
      alert(`El campo "${field.label}" es obligatorio para el funcionamiento base del sistema y no puede eliminarse.`)
      return
    }
    if (!confirm(`¿Eliminar la pregunta "${field.label}"?`)) return
    setFormFields(prev => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  function handleMove(index, direction) {
    const updated = [...formFields]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= updated.length) return
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setFormFields(updated)
    setSaved(false)
  }

  async function handleSave() {
    if (!configured) {
      setError('Configurá GitHub en la pestaña de Configuración antes de guardar.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveFormConfig(formFields)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Error al guardar el diseño del formulario: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Editar Formulario</h2>
          <p>Añadí, reordená o personalizá las preguntas de tu formulario</p>
        </div>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleAddField} disabled={loading} style={{ gap: 6 }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar pregunta
          </button>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 800 }}>
        {!configured && (
          <div className="config-banner" onClick={() => setPage('settings')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            GitHub no está configurado. Los cambios no se guardarán en tu repositorio. Ir a Configuración &rarr;
          </div>
        )}

        {saved && <div className="alert alert-success">Formulario guardado en GitHub con éxito</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span className="spinner spinner-dark" style={{ margin: '0 auto', width: 36, height: 36, borderWidth: 4 }} />
            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Cargando estructura del formulario...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formFields.map((field, index) => {
              const isProtected = ['correo', 'nombre', 'proyecto'].includes(field.key)
              return (
                <div
                  key={field.key}
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pregunta #{index + 1} {isProtected ? ' (Requerida por el sistema)' : ''}
                    </span>
                    
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        style={{ padding: '4px 8px', minWidth: 'auto' }}
                      >
                        &uarr;
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === formFields.length - 1}
                        style={{ padding: '4px 8px', minWidth: 'auto' }}
                      >
                        &darr;
                      </button>
                      {!isProtected && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRemoveField(index)}
                          style={{ padding: '4px 8px', minWidth: 'auto', color: 'var(--danger)' }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 12 }}>Título / Pregunta</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => handleFieldChange(index, 'label', e.target.value)}
                        placeholder="Escribe la pregunta..."
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 12 }}>Tipo de respuesta</label>
                      <select
                        value={field.type}
                        onChange={e => handleFieldChange(index, 'type', e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="text">Texto corto</option>
                        <option value="textarea">Texto largo (Párrafo)</option>
                        <option value="email">Correo electrónico</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 12 }}>Estilo / Categoría</label>
                      <select
                        value={field.category || 'standard'}
                        onChange={e => handleFieldChange(index, 'category', e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="standard">Estándar</option>
                        <option value="luces">Luces (Verde)</option>
                        <option value="sombras">Sombras (Naranja)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 12 }}>Texto sugerido (Placeholder)</label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={e => handleFieldChange(index, 'placeholder', e.target.value)}
                        placeholder="Escribe el texto de ejemplo..."
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 12 }}>Aclaración (Hint)</label>
                      <input
                        type="text"
                        value={field.hint || ''}
                        onChange={e => handleFieldChange(index, 'hint', e.target.value)}
                        placeholder="Escribe un consejo o aclaración..."
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id={`req-${field.key}`}
                      checked={field.required}
                      disabled={isProtected}
                      onChange={e => handleFieldChange(index, 'required', e.target.checked)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    <label htmlFor={`req-${field.key}`} style={{ cursor: 'pointer', fontSize: 13, marginBottom: 0 }}>
                      Es obligatorio responder esta pregunta
                    </label>
                  </div>
                </div>
              )
            })}

            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" /> Guardando en GitHub...</> : 'Guardar Diseño de Formulario'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
