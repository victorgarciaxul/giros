import { useState } from 'react'
import { testConnection, isConfigured } from '../lib/github'

export default function Settings() {
  const [testing, setTesting]     = useState(false)
  const [result,  setResult]      = useState(null)
  const configured = isConfigured()

  async function handleTest() {
    setTesting(true)
    setResult(null)
    try {
      const r = await testConnection()
      setResult({ ok: true, msg: `Conexión correcta · servidor: ${new Date(r.time).toLocaleString('es-AR')}` })
    } catch (e) {
      setResult({ ok: false, msg: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Configuración</h2>
          <p>Estado de la base de datos y ajustes de la app</p>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 680 }}>

        {/* DB status card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div className="settings-section" style={{ marginBottom: 0 }}>
              <h3>Base de datos</h3>
              <p className="section-desc">
                Los registros se guardan en una base de datos PostgreSQL (Neon).
                No se requiere ninguna configuración adicional.
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: configured ? 'var(--success-light)' : 'var(--danger-light)',
                border: `1px solid ${configured ? '#6ee7b7' : '#fca5a5'}`,
                borderRadius: 'var(--radius)',
                marginBottom: 20,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: configured ? 'var(--success)' : 'var(--danger)',
                  boxShadow: configured ? '0 0 8px var(--success)' : 'none',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: configured ? '#065f46' : '#991b1b' }}>
                  {configured ? 'Base de datos configurada y lista' : 'Variable de entorno VITE_DATABASE_URL no encontrada'}
                </span>
              </div>

              {result && (
                <div className={`alert alert-${result.ok ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
                  {result.msg}
                </div>
              )}

              <button className="btn btn-ghost" onClick={handleTest} disabled={testing || !configured}>
                {testing
                  ? <><span className="spinner spinner-dark" /> Probando conexión...</>
                  : 'Probar conexión'}
              </button>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="card">
          <div className="card-body">
            <div className="settings-section" style={{ marginBottom: 0 }}>
              <h3>¿Cómo funciona el almacenamiento?</h3>
              <p className="section-desc">
                Cada registro que se envía desde el formulario se guarda directamente
                en la base de datos y aparece en el Dashboard en tiempo real.
              </p>

              <div className="code-block">
                Formulario → Base de datos Neon (PostgreSQL){'\n'}
                {'\n'}
                Tablas:{'\n'}
                · submissions  — todos los registros enviados{'\n'}
                · form_config  — configuración de las preguntas del formulario
              </div>

              <div className="divider" />

              <h3>Estructura de un registro</h3>
              <div className="code-block">{`{
  "id":         "identificador único",
  "created_at": "2026-05-20T10:00:00Z",
  "status":     "sent | draft | saved",
  "data": {
    "correo":      "nombre@xul.es",
    "nombre":      "Nombre Apellido",
    "proyecto":    "Nombre del proyecto",
    "contexto":    "...",
    "luces":       "...",
    "sombras":     "...",
    "comentarios": "..."
  }
}`}</div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
