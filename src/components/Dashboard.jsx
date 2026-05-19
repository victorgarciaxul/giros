import { useState, useEffect, useCallback } from 'react'
import { loadSubmissions, deleteSubmission, isConfigured, getShareableLink, loadFormConfig } from '../lib/github'

function Badge({ status }) {
  const map = {
    draft: { label: 'Borrador', cls: 'badge-draft' },
    saved: { label: 'Guardado', cls: 'badge-saved' },
    sent:  { label: 'Enviado',  cls: 'badge-sent'  },
  }
  const { label, cls } = map[status] || map.saved
  return <span className={`badge ${cls}`}>{label}</span>
}

function DetailModal({ submission, formFields = [], onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar este registro de GitHub?')) return
    setDeleting(true)
    try {
      await deleteSubmission(submission.id)
      onDelete(submission.id)
      onClose()
    } catch (e) {
      alert('Error al eliminar: ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  function handleCopyLink() {
    const url = getShareableLink('submission', submission.id)
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nameField = formFields.find(f => f.key === 'nombre') || { key: 'nombre', label: 'Nombre y apellido' }
  const projectField = formFields.find(f => f.key === 'proyecto') || { key: 'proyecto', label: 'Proyecto' }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{(submission[nameField.key] || 'Detalle')} — {(submission[projectField.key] || '')}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px 8px', minWidth: 'auto' }}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <Badge status={submission.status} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
              Creado el: {submission.createdAt
                ? new Date(submission.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>
          {formFields.map(f => (
            submission[f.key] ? (
              <div key={f.key} className={`detail-field${f.category === 'luces' ? ' detail-field-luces' : f.category === 'sombras' ? ' detail-field-sombras' : ''}`}>
                <label>{f.label}</label>
                <p>{submission[f.key]}</p>
              </div>
            ) : null
          ))}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCopyLink}
            style={{ marginRight: 'auto', gap: 6 }}
          >
            {copied ? (
              <>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, color: 'var(--success)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                ¡Enlace copiado!
              </>
            ) : (
              <>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922-.641m0 0a3 3 0 10-2.28 4.302m0-4.302a3 3 0 002.28-4.302m1.922 6.224l1.922.641m0 0a3 3 0 102.28-4.302m-2.28 4.302a3 3 0 00-2.28 4.302" />
                </svg>
                Compartir enlace
              </>
            )}
          </button>
          
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function exportCSV(list, formFields) {
  // Use keys from formFields dynamic list
  const cols = ['id', 'createdAt', 'status', ...formFields.map(f => f.key)]
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [cols.join(','), ...list.map(r => cols.map(c => esc(r[c])).join(','))]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `giros_registros_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Dashboard({ setPage }) {
  const [submissions, setSubmissions] = useState([])
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const configured = isConfigured()

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function handleShareForm() {
    if (!configured) {
      showToast('Configurá GitHub en Configuración antes de compartir el formulario', 'error')
      return
    }
    const url = getShareableLink('form')
    navigator.clipboard.writeText(url)
    showToast('Enlace de formulario copiado al portapapeles', 'success')
  }

  const load = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    setError(null)
    try {
      const [submissionsData, fieldsData] = await Promise.all([
        loadSubmissions(),
        loadFormConfig()
      ])
      setSubmissions(submissionsData)
      setFormFields(fieldsData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [configured])

  useEffect(() => { load() }, [load])

  const filtered = submissions.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || Object.values(s).some(v => String(v || '').toLowerCase().includes(q))
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    total: submissions.length,
    saved: submissions.filter(s => s.status === 'saved').length,
    sent: submissions.filter(s => s.status === 'sent').length,
  }

  function handleDelete(id) {
    setSubmissions(prev => prev.filter(s => s.id !== id))
  }

  const nameField = formFields.find(f => f.key === 'nombre') || { key: 'nombre', label: 'Nombre' }
  const projectField = formFields.find(f => f.key === 'proyecto') || { key: 'proyecto', label: 'Proyecto' }
  const contactField = formFields.find(f => f.key === 'correo') || { key: 'correo', label: 'Contacto' }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Registros</h2>
          <p>Historial de cosechas guardadas</p>
        </div>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleShareForm} style={{ gap: 6 }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922-.641m0 0a3 3 0 10-2.28 4.302m0-4.302a3 3 0 002.28-4.302m1.922 6.224l1.922.641m0 0a3 3 0 102.28-4.302m-2.28 4.302a3 3 0 00-2.28 4.302" />
            </svg>
            Compartir Formulario
          </button>

          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading || !configured}>
            {loading ? <span className="spinner spinner-dark" /> : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Actualizar
          </button>
          {submissions.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered, formFields)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
          )}

          <button className="btn btn-primary btn-sm" onClick={() => window.open(getShareableLink('form'), '_blank')} style={{ gap: 6 }} disabled={!configured}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir Formulario ↗
          </button>
        </div>
      </div>

      <div className="page-content">
        {toast && (
          <div className={`alert alert-${toast.type}`} style={{ marginBottom: 20 }}>
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

        {!configured && (
          <div className="config-banner" onClick={() => setPage('settings')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            GitHub no está configurado. Ir a Configuración →
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="stats-row">
          <div className="stat-card stat-total">
            <div className="stat-label">Total cosechados</div>
            <div className="stat-value">{counts.total}</div>
          </div>
          <div className="stat-card stat-saved">
            <div className="stat-label">Guardados</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{counts.saved}</div>
          </div>
          <div className="stat-card stat-sent">
            <div className="stat-label">Enviados</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{counts.sent}</div>
          </div>
        </div>

        <div className="filters-row">
          <input
            className="search-input"
            placeholder="🔍 Buscar por nombre, proyecto, correo o contexto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="saved">Guardados</option>
            <option value="sent">Enviados</option>
            <option value="draft">Borradores</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Cargando registros...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3>{search || filterStatus !== 'all' ? 'Sin resultados' : 'No hay registros aún'}</h3>
            <p>{search || filterStatus !== 'all' ? 'Probá con otros filtros' : 'Completá el formulario para guardar el primer registro'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{nameField.label}</th>
                  <th>{projectField.label}</th>
                  <th>{contactField.label}</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} onClick={() => setSelected(s)}>
                    <td style={{ fontWeight: 500 }}>{s[nameField.key] || '—'}</td>
                    <td className="td-truncate">{s[projectField.key] || '—'}</td>
                    <td className="td-truncate" style={{ color: 'var(--text-muted)' }}>{s[contactField.key] || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '—'}
                    </td>
                    <td><Badge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          submission={selected}
          formFields={formFields}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
