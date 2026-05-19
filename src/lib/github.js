const BASE = 'https://api.github.com'

export const DEFAULT_FIELDS = [
  { key: 'correo', label: 'Correo electrónico', type: 'email', required: true, placeholder: 'tu@email.com', category: 'standard' },
  { key: 'nombre', label: 'Nombre y apellido', type: 'text', required: true, placeholder: 'Tu nombre completo', category: 'standard' },
  { key: 'proyecto', label: 'Proyecto', type: 'text', required: true, placeholder: 'Nombre del proyecto', category: 'standard' },
  { key: 'contexto', label: '¿Cuál fue la situación? (Contexto)', type: 'textarea', required: true, placeholder: 'Contanos brevemente qué pasó...', hint: 'Describí el contexto de la situación que querés analizar', category: 'standard' },
  { key: 'luces', label: 'Luces', type: 'textarea', required: true, placeholder: 'Escribí los aciertos, lo que funcionó...', hint: '¿Qué salió bien? ¿Cuáles fueron las buenas prácticas?', category: 'luces' },
  { key: 'sombras', label: 'Sombras', type: 'textarea', required: true, placeholder: 'Mencioná las dificultades, los desvíos...', hint: '¿Qué se podría haber hecho mejor? ¿Qué fallas o trabas hubo?', category: 'sombras' },
  { key: 'comentarios', label: 'Comentarios, notas, ideas adicionales', type: 'textarea', required: false, placeholder: 'Cualquier otra observación...', hint: 'Opcional', category: 'standard' }
]

function getConfig() {
  try {
    return JSON.parse(localStorage.getItem('giros_github_config') || '{}')
  } catch {
    return {}
  }
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

async function getFile(config) {
  const { token, owner, repo, branch, filepath } = config
  const url = `${BASE}/repos/${owner}/${repo}/contents/${filepath}?ref=${branch}`
  const res = await fetch(url, { headers: headers(token) })
  if (res.status === 404) return { content: [], sha: null }
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const decoded = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))))
  return { content: decoded, sha: data.sha }
}

async function putFile(config, content, sha, message) {
  const { token, owner, repo, branch, filepath } = config
  const url = `${BASE}/repos/${owner}/${repo}/contents/${filepath}`
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
    branch,
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(url, { method: 'PUT', headers: headers(token), body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function loadSubmissions() {
  const config = getConfig()
  if (!config.token) throw new Error('No configurado')
  const { content } = await getFile(config)
  return Array.isArray(content) ? content : []
}

export async function saveSubmission(submission) {
  const config = getConfig()
  if (!config.token) throw new Error('No configurado')
  const { content, sha } = await getFile(config)
  const list = Array.isArray(content) ? content : []
  const idx = list.findIndex(s => s.id === submission.id)
  if (idx >= 0) list[idx] = submission
  else list.unshift(submission)
  await putFile(config, list, sha, `Registro: ${submission.nombre} — ${submission.proyecto}`)
  return submission
}

export async function deleteSubmission(id) {
  const config = getConfig()
  if (!config.token) throw new Error('No configurado')
  const { content, sha } = await getFile(config)
  const list = (Array.isArray(content) ? content : []).filter(s => s.id !== id)
  await putFile(config, list, sha, `Eliminar registro ${id}`)
}

export async function testConnection() {
  const config = getConfig()
  if (!config.token || !config.owner || !config.repo) throw new Error('Faltan datos de configuración')
  const url = `${BASE}/repos/${config.owner}/${config.repo}`
  const res = await fetch(url, { headers: headers(config.token) })
  if (!res.ok) throw new Error(`No se pudo conectar (${res.status})`)
  return res.json()
}

export function isConfigured() {
  const c = getConfig()
  return !!(c.token && c.owner && c.repo && c.branch && c.filepath)
}

export function getShareableLink(type, id = null) {
  const config = getConfig()
  const params = new URLSearchParams()
  
  if (type === 'form') {
    params.set('fill', 'true')
  } else if (type === 'submission' && id) {
    params.set('id', id)
  }
  
  if (config.owner && config.repo && config.token) {
    params.set('o', config.owner)
    params.set('r', config.repo)
    if (config.branch !== 'main') params.set('b', config.branch)
    if (config.filepath !== 'data/submissions.json') params.set('p', config.filepath)
    try {
      params.set('t', btoa(config.token))
    } catch (e) { /* ignore */ }
  }
  
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}

export async function loadFormConfig() {
  const config = getConfig()
  if (!config.token) return DEFAULT_FIELDS
  const configPath = 'data/form_config.json'
  const url = `${BASE}/repos/${config.owner}/${config.repo}/contents/${configPath}?ref=${config.branch}`
  try {
    const res = await fetch(url, { headers: headers(config.token) })
    if (res.status === 404) return DEFAULT_FIELDS
    if (!res.ok) return DEFAULT_FIELDS
    const data = await res.json()
    const decoded = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))))
    return decoded
  } catch (e) {
    console.error('Error loading form config:', e)
    return DEFAULT_FIELDS
  }
}

export async function saveFormConfig(formFields) {
  const config = getConfig()
  if (!config.token) throw new Error('No configurado')
  const configPath = 'data/form_config.json'
  
  let sha = null
  const url = `${BASE}/repos/${config.owner}/${config.repo}/contents/${configPath}?ref=${config.branch}`
  try {
    const res = await fetch(url, { headers: headers(config.token) })
    if (res.ok) {
      const data = await res.json()
      sha = data.sha
    }
  } catch (e) { /* ignore */ }

  const body = {
    message: 'Actualizar configuración del formulario',
    content: btoa(unescape(encodeURIComponent(JSON.stringify(formFields, null, 2)))),
    branch: config.branch,
    ...(sha ? { sha } : {}),
  }
  const putUrl = `${BASE}/repos/${config.owner}/${config.repo}/contents/${configPath}`
  const res = await fetch(putUrl, { method: 'PUT', headers: headers(config.token), body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${await res.text()}`)
  return res.json()
}
