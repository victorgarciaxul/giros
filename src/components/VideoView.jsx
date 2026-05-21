import { useState, useEffect } from 'react'
import { getMediaById } from '../lib/github'

function toDriveEmbed(url) {
  if (!url) return null
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return null
}

function isGoogleDrive(url) {
  return url && url.includes('drive.google.com')
}

function GirosHeader() {
  return (
    <div style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12,
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'linear-gradient(135deg, #c0312b 0%, #e05a55 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg viewBox="0 0 40 40" fill="none" style={{ width: 20, height: 20 }}>
          <circle cx="20" cy="20" r="7" stroke="white" strokeWidth="2.5" fill="none" />
          <path d="M20 6 C28 6, 34 12, 34 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M34 20 C34 28, 28 34, 20 34" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M20 34 C12 34, 6 28, 6 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M6 20 C6 12, 12 6, 20 6" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4" fill="none" />
          <path d="M17 4.5 L20 6 L23 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <div>
        <span style={{ fontWeight: 800, color: 'var(--text-heading)', fontSize: 15 }}>GIROS</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>Media · XUL</span>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const s = dateStr instanceof Date ? dateStr.toISOString().slice(0, 10) : String(dateStr).slice(0, 10)
  const d = new Date(s + 'T12:00:00')
  if (isNaN(d)) return null
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function renderVideoPlayer(item) {
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
        style={{ width: '100%', maxHeight: '65vh', display: 'block', background: '#000' }}
      />
    )
  }

  // Legacy base64
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.6 }}>
        Este video fue subido con el sistema antiguo. Eliminalo y vuelve a subirlo.
      </p>
    </div>
  )
}

export default function VideoView({ id }) {
  const [item, setItem]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getMediaById(id)
        if (data) setItem(data)
        else setError('El video no existe o fue eliminado.')
      } catch (e) {
        setError('Error al cargar el video: ' + e.message)
      } finally {
        setLoad(false)
      }
    }
    load()
  }, [id])

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <GirosHeader />

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
          <span className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Cargando video...</p>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px' }}>
          <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth={1.5} style={{ width: 48, height: 48, margin: '0 auto 16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 10 }}>Video no encontrado</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && item && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px 80px' }}>

          {/* Video player */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: '#000',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            marginBottom: 32, minHeight: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {renderVideoPlayer(item)}
          </div>

          {/* Info card */}
          <div className="card">
            <div className="card-body" style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: item.description ? 20 : 0 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 6, lineHeight: 1.2 }}>
                    {item.title}
                  </h1>
                  {item.recordedAt && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(item.recordedAt)}
                    </p>
                  )}
                </div>

                {/* Copy link button */}
                <button
                  onClick={handleCopy}
                  className="btn btn-ghost btn-sm"
                  style={{ gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {copied ? (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth={2.5} style={{ width: 14, height: 14 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      ¡Enlace copiado!
                    </>
                  ) : (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar enlace
                    </>
                  )}
                </button>
              </div>

              {item.description && (
                <>
                  <div className="divider" style={{ margin: '0 0 20px' }} />
                  <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {item.description}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>
            GIROS · Cosecha de aprendizajes · XUL
          </p>
        </div>
      )}
    </div>
  )
}
