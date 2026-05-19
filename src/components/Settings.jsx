import { useState, useEffect } from 'react'
import { testConnection } from '../lib/github'

const DEFAULTS = {
  owner: '',
  repo: '',
  branch: 'main',
  filepath: 'data/submissions.json',
  token: '',
}

export default function Settings() {
  const [config, setConfig] = useState(DEFAULTS)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('giros_github_config') || '{}')
      setConfig({ ...DEFAULTS, ...stored })
    } catch { /* ignore */ }
  }, [])

  function set(key, val) {
    setConfig(prev => ({ ...prev, [key]: val }))
    setSaved(false)
    setTestResult(null)
  }

  function handleSave() {
    localStorage.setItem('giros_github_config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleTest() {
    localStorage.setItem('giros_github_config', JSON.stringify(config))
    setTesting(true)
    setTestResult(null)
    try {
      const repo = await testConnection()
      setTestResult({ ok: true, msg: `Conectado a "${repo.full_name}" correctamente` })
    } catch (e) {
      setTestResult({ ok: false, msg: e.message })
    } finally {
      setTesting(false)
    }
  }

  function handleClear() {
    if (!confirm('¿Borrar la configuración guardada?')) return
    localStorage.removeItem('giros_github_config')
    setConfig(DEFAULTS)
    setTestResult(null)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Configuración</h2>
          <p>Credenciales de sincronización con tu repositorio de GitHub</p>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 800 }}>

        {saved && <div className="alert alert-success">Configuración guardada</div>}
        {testResult && (
          <div className={`alert alert-${testResult.ok ? 'success' : 'error'}`}>
            {testResult.msg}
          </div>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div className="settings-section">
              <h3>Repositorio de GitHub</h3>
              <p className="section-desc">
                Los registros se guardan como un archivo JSON en el repositorio que configures.
              </p>

              <div className="form-grid">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Usuario u organización</label>
                    <input
                      type="text"
                      value={config.owner}
                      onChange={e => set('owner', e.target.value)}
                      placeholder="mi-usuario"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre del repositorio</label>
                    <input
                      type="text"
                      value={config.repo}
                      onChange={e => set('repo', e.target.value)}
                      placeholder="giros-data"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Rama (branch)</label>
                    <input
                      type="text"
                      value={config.branch}
                      onChange={e => set('branch', e.target.value)}
                      placeholder="main"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ruta del archivo</label>
                    <input
                      type="text"
                      value={config.filepath}
                      onChange={e => set('filepath', e.target.value)}
                      placeholder="data/submissions.json"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="settings-section">
              <h3>Personal Access Token</h3>
              <p className="section-desc">
                Necesitás un token con permisos de lectura y escritura en el repositorio.
              </p>
              <div className="form-group">
                <label>Token</label>
                <input
                  type="password"
                  value={config.token}
                  onChange={e => set('token', e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
              </div>
            </div>

            <div className="btn-row" style={{ marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSave}>
                Guardar configuración
              </button>
              <button className="btn btn-ghost" onClick={handleTest} disabled={testing}>
                {testing ? <><span className="spinner spinner-dark" /> Probando...</> : 'Probar conexión'}
              </button>
              <button className="btn btn-ghost" onClick={handleClear} style={{ marginLeft: 'auto' }}>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="settings-section" style={{ marginBottom: 0 }}>
              <h3>¿Cómo obtener el Personal Access Token?</h3>
              <p className="section-desc">Seguí estos pasos en tu cuenta de GitHub:</p>
              
              <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', gap: 12, fontSize: 13.5, alignItems: 'flex-start' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(13, 185, 168, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>1</span>
                  <span>Ingresá a <strong>github.com</strong> y dirigite a: <strong>Settings</strong> &rarr; <strong>Developer settings</strong></span>
                </li>
                <li style={{ display: 'flex', gap: 12, fontSize: 13.5, alignItems: 'flex-start' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(13, 185, 168, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>2</span>
                  <span>Seleccioná: <strong>Personal access tokens</strong> &rarr; <strong>Tokens (classic)</strong> &rarr; <strong>Generate new token</strong></span>
                </li>
                <li style={{ display: 'flex', gap: 12, fontSize: 13.5, alignItems: 'flex-start' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(13, 185, 168, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>3</span>
                  <span>Marcá el permiso obligatorio: <strong>repo</strong> (Full control of private repositories)</span>
                </li>
                <li style={{ display: 'flex', gap: 12, fontSize: 13.5, alignItems: 'flex-start' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(13, 185, 168, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>4</span>
                  <span>Copiá el token generado y pegalo en el campo superior <strong>Token</strong></span>
                </li>
              </ul>

              <div className="divider" />

              <h3>Estructura del archivo en GitHub</h3>
              <p className="section-desc">
                Los registros se guardan en un archivo JSON estructurado de la siguiente forma en la ruta:{' '}
                <code style={{ background: 'var(--bg)', padding: '3px 6px', borderRadius: 4, fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  {config.owner || 'usuario'}/{config.repo || 'repositorio'}/{config.filepath}
                </code>
              </p>
              <div className="code-block">
                {`[
  {
    "id": "abc123",
    "createdAt": "2026-05-19T14:00:00.000Z",
    "status": "saved",
    "correo": "nombre@ejemplo.com",
    "nombre": "Nombre Apellido",
    "proyecto": "Nombre del proyecto",
    "contexto": "Descripción de la situación...",
    "luces": "Lo que funcionó bien...",
    "sombras": "Lo que se puede mejorar...",
    "comentarios": "Notas adicionales"
  }
]`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
