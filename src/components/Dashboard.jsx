import { useState, useEffect, useCallback } from 'react'
import { loadSubmissions, deleteSubmission, isConfigured, getShareableLink, loadFormConfig } from '../lib/github'

function Badge({ status }) {
  const map = {
    draft: { label: 'Pendiente', cls: 'badge-draft' },
    saved: { label: 'Guardado',  cls: 'badge-saved' },
    sent:  { label: 'Enviado',   cls: 'badge-sent'  },
  }
  const { label, cls } = map[status] || map.saved
  return <span className={`badge ${cls}`}>{label}</span>
}

function DetailModal({ submission, formFields = [], onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar este registro?')) return
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
              {new Date(submission.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
          <button className="btn btn-ghost btn-sm" onClick={handleCopyLink} style={{ marginRight: 'auto', gap: 6 }}>
            {copied ? (
              <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14, color: 'var(--success)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>¡Enlace copiado!</>
            ) : (
              <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922-.641m0 0a3 3 0 10-2.28 4.302m0-4.302a3 3 0 002.28-4.302m1.922 6.224l1.922.641m0 0a3 3 0 102.28-4.302m-2.28 4.302a3 3 0 00-2.28 4.302" /></svg>Compartir enlace</>
            )}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminando...' : 'Eliminar'}</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function exportCSV(list, formFields) {
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
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('recibidos')
  const [copiedId, setCopiedId] = useState(null)
  const configured = isConfigured()

  const load = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    setError(null)
    try {
      const [submissionsData, fieldsData] = await Promise.all([loadSubmissions(), loadFormConfig()])
      setSubmissions(submissionsData)
      setFormFields(fieldsData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [configured])

  useEffect(() => { load() }, [load])

  function handleDelete(id) {
    setSubmissions(prev => prev.filter(s => s.id !== id))
  }

  async function handleDeleteDraft(id) {
    if (!confirm('¿Eliminar este formulario creado?')) return
    try {
      await deleteSubmission(id)
      setSubmissions(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      alert('Error al eliminar: ' + e.message)
    }
  }

  function handleCopyDraftLink(id) {
    const url = getShareableLink('submission', id)
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const drafts = submissions.filter(s => s.status === 'draft')
  const received = submissions.filter(s => s.status !== 'draft')

  const q = search.toLowerCase()
  const filteredReceived = received.filter(s =>
    !q || Object.values(s).some(v => String(v || '').toLowerCase().includes(q))
  )

  const nameField = formFields.find(f => f.key === 'nombre') || { key: 'nombre', label: 'Nombre' }
  const projectField = formFields.find(f => f.key === 'proyecto') || { key: 'proyecto', label: 'Proyecto' }
  const contactField = formFields.find(f => f.key === 'correo') || { key: 'correo', label: 'Contacto' }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Formularios creados y respuestas recibidas</p>
        </div>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading || !configured}>
            {loading ? <span className="spinner spinner-dark" /> : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Actualizar
          </button>
          {received.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filteredReceived, formFields)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card stat-total">
            <div className="stat-label">Total</div>
            <div className="stat-value">{submissions.length}</div>
          </div>
          <div className="stat-card stat-saved">
            <div className="stat-label">Creados</div>
            <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{drafts.length}</div>
          </div>
          <div className="stat-card stat-sent">
            <div className="stat-label">Recibidos</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{received.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {[
            { id: 'recibidos', label: `Recibidos (${received.length})` },
            { id: 'creados',   label: `Creados (${drafts.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                color: tab === t.id ? 'var(--text-heading)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--xul-red)' : '2px solid transparent',
                marginBottom: -1, transition: 'color .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Cargando...</p>
          </div>
        ) : tab === 'recibidos' ? (
          <>
            <div className="filters-row">
              <input
                className="search-input"
                placeholder="🔍 Buscar por nombre, proyecto, correo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {filteredReceived.length === 0 ? (
              <div className="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3>{search ? 'Sin resultados' : 'No hay respuestas aún'}</h3>
                <p>{search ? 'Probá con otros términos' : 'Cuando alguien rellene y envíe un formulario aparecerá aquí'}</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceived.map(s => (
                      <tr key={s.id} onClick={() => setSelected(s)}>
                        <td style={{ fontWeight: 500 }}>{s[nameField.key] || '—'}</td>
                        <td className="td-truncate">{s[projectField.key] || '—'}</td>
                        <td className="td-truncate" style={{ color: 'var(--text-muted)' }}>{s[contactField.key] || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* Creados tab */
          drafts.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>No hay formularios creados</h3>
              <p>Creá un formulario desde la sección <strong>Formularios</strong> y compartí el enlace</p>
              <button className="btn btn-primary" onClick={() => setPage('editor')} style={{ marginTop: 20 }}>
                Ir a Formularios
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drafts.map(d => (
                <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 3 }}>
                      Formulario pendiente de rellenar
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Creado el {new Date(d.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleCopyDraftLink(d.id)}
                      style={{ gap: 6 }}
                    >
                      {copiedId === d.id ? (
                        <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ width: 13, height: 13 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>¡Copiado!</>
                      ) : 'Copiar enlace'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteDraft(d.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
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
