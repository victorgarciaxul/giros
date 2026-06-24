import { useState, useEffect, useRef } from 'react'

const USERS = [
  { email: 'josecastillo@xul.es', password: 'Xul14$' },
  { email: 'carlagarcia@xul.es',  password: 'Xul14$' },
  { email: 'tech@xul.es',         password: 'Xul14$' },
  { email: 'elenarojo@xul.es',    password: 'Xul14$' },
  { email: 'invitado@xul.es',     password: 'Giros2026*', role: 'guest' },
]

const FLOATING_WORDS = [
  { text: 'Luces', x: 8,  y: 12, delay: 0,   dur: 18 },
  { text: 'Sombras', x: 78, y: 8,  delay: 2,   dur: 22 },
  { text: 'Aprendizaje', x: 88, y: 35, delay: 1,   dur: 20 },
  { text: 'Contexto', x: 5,  y: 55, delay: 3,   dur: 16 },
  { text: 'Proyecto', x: 82, y: 68, delay: 0.5, dur: 24 },
  { text: 'Cosecha', x: 12, y: 75, delay: 4,   dur: 19 },
  { text: 'Equipo', x: 70, y: 88, delay: 1.5, dur: 21 },
  { text: 'Reflexión', x: 20, y: 22, delay: 2.5, dur: 17 },
  { text: '+14 registros', x: 60, y: 15, delay: 3.5, dur: 23 },
  { text: '3 proyectos', x: 5,  y: 38, delay: 1,   dur: 20 },
  { text: '×6 equipos',  x: 85, y: 52, delay: 2,   dur: 18 },
  { text: 'Mejora continua', x: 35, y: 82, delay: 0.5, dur: 25 },
]


export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [shake, setShake]       = useState(false)
  const emailRef = useRef(null)

  useEffect(() => { emailRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const match = USERS.find(
        u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      )
      if (match) {
        onLogin({ email: match.email, role: match.role || 'admin' })
      } else {
        setError('Usuario o contraseña incorrectos')
        setLoading(false)
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    }, 700)
  }

  return (
    <div className="login-root">
      {/* ── Animated background ── */}
      <div className="login-bg">

        {/* Rotating rings */}
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />

        {/* Rotating spiral arms */}
        <div className="spiral" />

        {/* Center glow */}
        <div className="center-glow" />

        {/* Floating words */}
        {FLOATING_WORDS.map((w, i) => (
          <span
            key={i}
            className="float-word"
            style={{
              left: `${w.x}%`,
              top:  `${w.y}%`,
              animationDelay: `${w.delay}s`,
              animationDuration: `${w.dur}s`,
            }}
          >
            {w.text}
          </span>
        ))}

      </div>

      {/* ── Login card ── */}
      <form
        className={`login-card${shake ? ' shake' : ''}`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Icon */}
        <div className="login-icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="7" stroke="white" strokeWidth="2.5" fill="none" />
            <path
              d="M20 6 C28 6, 34 12, 34 20"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
            />
            <path
              d="M34 20 C34 28, 28 34, 20 34"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
            />
            <path
              d="M20 34 C12 34, 6 28, 6 20"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
            />
            <path
              d="M6 20 C6 12, 12 6, 20 6"
              stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray="3 4" fill="none"
            />
            {/* Arrow at top */}
            <path d="M17 4.5 L20 6 L23 4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <h1 className="login-title">GIROS</h1>
        <p className="login-subtitle">PROYECTOS COMPARTIDOS · XUL</p>
        <p className="login-welcome">Bienvenido/a. Introduce tus credenciales.</p>

        <div className="login-field">
          <label>USUARIO</label>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="usuario@xul.es"
            autoComplete="email"
            required
          />
        </div>

        <div className="login-field">
          <label>CONTRASEÑA</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? (
            <span className="login-spinner" />
          ) : (
            'Acceder al Panel'
          )}
        </button>

        <p className="login-footer">XUL © 2026</p>
      </form>
    </div>
  )
}
