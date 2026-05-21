import { useState, useEffect, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import { loadMedia, saveMedia, deleteMedia, isConfigured, getShareableLink } from '../lib/github'
import DatePicker from './DatePicker'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

async function uploadToBlob(file, onProgress) {
  onProgress('Subiendo video...')
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    onUploadProgress: ({ percentage }) => {
      onProgress(`Subiendo... ${Math.round(percentage)}%`)
    },
  })
  return blob.url
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const s = dateStr instanceof Date ? dateStr.toISOString().slice(0, 10) : String(dateStr).slice(0, 10)
  const d = new Date(s + 'T12:00:00')
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toDriveEmbed(url) {
  if (!url) return null
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return null
}

function isGoogleDrive(url) {
  return url && url.includes('drive.google.com')
}

// ── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onSave, onClose }) {
  const [tab, setTab]           = useState('url')   // 'url' | 'file'
  const [videoUrl, setVideoUrl] = useState('')
  const [title, setTitle]       = useState('')
  const [date, setDate]         = useState('')
  const [description, setDesc]  = useState('')
  const [videoFile, setVideo]   = useState(null)
  const [thumbFile, setThumb]   = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [progress, setProgress] = useState('')
  const videoRef = useRef()
  const thumbRef = useRef()

  async function handleThumbChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setThumb(f)
    const url = URL.createObjectURL(f)
    setThumbPreview(url)
  }

  async function handleSave() {
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    if (tab === 'url' && !videoUrl.trim()) { setError('Pegá una URL de video.'); return }
    if (tab === 'file' && !videoFile)      { setError('Seleccioná un archivo de video.'); return }
    setSaving(true)
    setError(null)
    try {
      let videoData
      let videoName = null

      if (tab === 'url') {
        videoData = videoUrl.trim()
      } else {
        videoData = await uploadToBlob(videoFile, setProgress)
        videoName = videoFile.name
      }

      let thumbnail = null
      if (thumbFile) {
        setProgress('Procesando miniatura...')
        thumbnail = await readFileAsDataURL(thumbFile)
      }

      setProgress('Guardando...')
      await onSave({
        id: genId(),
        title: title.trim(),
        recordedAt: date || null,
        description: description.trim() || null,
        thumbnail,
        videoData,
        videoName,
        createdAt: new Date().toISOString(),
      })
      onClose()
    } catch (e) {
      setError('Error al guardar: ' + e.message)
      setSaving(false)
      setProgress('')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>Nueva videoconferencia</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving} style={{ padding: '4px 8px', minWidth: 'auto' }}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Segmented control */}
          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, gap: 2 }}>
            {[
              { id: 'url',  icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, label: 'Enlace' },
              { id: 'file', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>, label: 'Archivo' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(null) }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', border: 'none', borderRadius: 7, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, transition: 'all .15s',
                  background: tab === t.id ? 'var(--surface)' : 'transparent',
                  color: tab === t.id ? 'var(--text-heading)' : 'var(--text-muted)',
                  boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* URL tab */}
          {tab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Supported sources pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'Google Drive', color: '#4285F4' },
                  { label: 'YouTube',      color: '#FF0000' },
                  { label: 'Loom',         color: '#625DF5' },
                  { label: 'URL directa',  color: 'var(--text-muted)' },
                ].map(s => (
                  <span key={s.label} style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px',
                    borderRadius: 20, background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: s.color, letterSpacing: 0.2,
                  }}>{s.label}</span>
                ))}
              </div>

              {/* Input */}
              <div style={{ position: 'relative' }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, pointerEvents: 'none', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => { setVideoUrl(e.target.value); setError(null) }}
                  placeholder="https://drive.google.com/file/d/..."
                  className="media-url-input"
                  style={{
                    paddingLeft: 40, paddingRight: 16,
                    fontFamily: videoUrl ? 'monospace' : 'inherit',
                    fontSize: videoUrl ? 12.5 : 13,
                    letterSpacing: videoUrl ? 0.2 : 'normal',
                  }}
                  autoFocus
                />
              </div>

              {/* Smart hint */}
              {videoUrl && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8,
                  background: videoUrl.includes('drive.google.com') ? 'rgba(66,133,244,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${videoUrl.includes('drive.google.com') ? 'rgba(66,133,244,0.25)' : 'var(--border)'}`,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: videoUrl.includes('drive.google.com') ? '#4285F4' : 'var(--success)',
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {videoUrl.includes('drive.google.com')
                      ? 'Google Drive detectado — se reproducirá con el player integrado'
                      : videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
                        ? 'YouTube detectado — se abrirá en una nueva pestaña'
                        : 'URL de video directa — se reproducirá en el player nativo'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* File tab */}
          {tab === 'file' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Archivo de video</label>
              <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setVideo(e.target.files[0] || null)} />
              <div
                onClick={() => videoRef.current.click()}
                style={{
                  border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '20px 16px',
                  textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s',
                  background: videoFile ? 'rgba(16,185,129,0.04)' : 'var(--bg)',
                  borderColor: videoFile ? 'var(--success)' : 'var(--border)',
                }}
                onMouseEnter={e => { if (!videoFile) e.currentTarget.style.borderColor = 'var(--primary)' }}
                onMouseLeave={e => { if (!videoFile) e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                {videoFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth={2} style={{ width: 20, height: 20, flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{videoFile.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setVideo(null) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>
                  </div>
                ) : (
                  <>
                    <svg fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.5} style={{ width: 32, height: 32, margin: '0 auto 8px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Hacé clic para seleccionar el archivo de video</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.7 }}>MP4, MOV, WebM, AVI...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Thumbnail upload */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Miniatura <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
            <input ref={thumbRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleThumbChange} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                onClick={() => thumbRef.current.click()}
                style={{
                  width: 96, height: 64, borderRadius: 8, border: '2px dashed var(--border)',
                  overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                  background: thumbPreview ? 'none' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {thumbPreview
                  ? <img src={thumbPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.5} style={{ width: 24, height: 24 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                }
              </div>
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => thumbRef.current.click()} style={{ marginBottom: 4 }}>
                  {thumbPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG o WebP</p>
              </div>
              {thumbPreview && (
                <button onClick={() => { setThumb(null); setThumbPreview(null) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Título <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setError(null) }} placeholder="Ej: Reunión de equipo — Sprint 4" />
          </div>

          {/* Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Fecha <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
            <DatePicker value={date} onChange={setDate} placeholder="Seleccionar fecha" />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Descripción <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Tema tratado, participantes, notas clave..." rows={3} />
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 0 }}>{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8 }}>
            {saving ? (
              <><span className="spinner" />{progress || 'Guardando...'}</>
            ) : (
              <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Guardar</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Player Modal ─────────────────────────────────────────────────────────────
function PlayerModal({ item, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied]     = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return
    setDeleting(true)
    try {
      await onDelete(item.id)
      onClose()
    } catch (e) {
      alert('Error al eliminar: ' + e.message)
      setDeleting(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(getShareableLink('video', item.id))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function renderPlayer() {
    const url = item.videoData
    if (!url) return null

    if (isGoogleDrive(url)) {
      return (
        <iframe
          src={toDriveEmbed(url)}
          style={{ width: '100%', height: 400, border: 'none', display: 'block' }}
          allow="autoplay"
          allowFullScreen
        />
      )
    }

    if (url.startsWith('http')) {
      return (
        <video
          src={url}
          poster={item.thumbnail || undefined}
          controls
          autoPlay
          style={{ width: '100%', maxHeight: '60vh', background: '#000', display: 'block' }}
        />
      )
    }

    // Legacy base64
    return (
      <div style={{ width: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
          Este video fue subido con el sistema antiguo. Eliminalo y vuelve a subirlo.
        </p>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780, width: '96vw' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ marginBottom: 2 }}>{item.title}</h3>
            {item.recordedAt && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {formatDate(item.recordedAt)}
              </p>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px 8px', minWidth: 'auto' }}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          {renderPlayer()}
          {item.description && (
            <p style={{ padding: '20px 24px 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {item.description}
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleCopy} style={{ marginLeft: 'auto', gap: 6 }}>
            {copied ? (
              <><svg fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth={2.5} style={{ width: 13, height: 13 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>¡Copiado!</>
            ) : (
              <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copiar enlace</>
            )}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ── Media Card ───────────────────────────────────────────────────────────────
function MediaCard({ item, onClick }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(getShareableLink('video', item.id))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s, border-color .15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Thumbnail / video preview */}
      <div style={{ position: 'relative', paddingTop: '56.25%', background: '#0f172a', flexShrink: 0 }}>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} style={{ width: 40, height: 40 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}
        {/* Overlay: play + copy */}
        <div
          className="media-card-overlay"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <svg fill="var(--xul-red)" viewBox="0 0 24 24" style={{ width: 24, height: 24, marginLeft: 3 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          {/* Copy link pill */}
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute', bottom: 10, right: 10,
              background: copied ? 'rgba(16,185,129,0.9)' : 'rgba(0,0,0,0.65)',
              border: 'none', borderRadius: 20, padding: '5px 12px',
              color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              backdropFilter: 'blur(4px)', transition: 'background .2s',
            }}
          >
            {copied ? (
              <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ width: 11, height: 11 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>¡Copiado!</>
            ) : (
              <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 11, height: 11 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copiar enlace</>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.3 }}>{item.title}</div>
        {item.recordedAt && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(item.recordedAt)}</div>
        )}
        {item.description && (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Media() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [showUpload, setUpload] = useState(false)
  const [selected, setSelected] = useState(null)
  const configured = isConfigured()

  useEffect(() => {
    async function load() {
      if (!configured) { setLoading(false); return }
      try {
        setItems(await loadMedia())
      } catch (e) {
        setError('Error al cargar los videos: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [configured])

  async function handleSave(item) {
    await saveMedia(item)
    setItems(prev => [item, ...prev])
  }

  async function handleDelete(id) {
    await deleteMedia(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Media</h2>
          <p>Videoconferencias y grabaciones del equipo</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setUpload(true)}
          disabled={loading || !configured}
          style={{ gap: 6 }}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Subir video
        </button>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Cargando videos...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <h3>No hay videos todavía</h3>
            <p>Subí la primera videoconferencia del equipo</p>
            <button className="btn btn-primary" onClick={() => setUpload(true)} style={{ marginTop: 20 }}>
              Subir video
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {items.map(item => (
              <MediaCard key={item.id} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onSave={handleSave}
          onClose={() => setUpload(false)}
        />
      )}

      {selected && (
        <PlayerModal
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
