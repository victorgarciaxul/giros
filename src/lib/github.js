import { neon } from '@neondatabase/serverless'

const sql = neon(import.meta.env.VITE_DATABASE_URL)

export const DEFAULT_FIELDS = [
  { key: 'correo',    label: 'Correo electrónico',                    type: 'email',    required: true,  placeholder: 'tu@email.com',                          category: 'standard' },
  { key: 'nombre',    label: 'Nombre y apellido',                     type: 'text',     required: true,  placeholder: 'Tu nombre completo',                    category: 'standard' },
  { key: 'proyecto',  label: 'Proyecto',                              type: 'text',     required: true,  placeholder: 'Nombre del proyecto',                   category: 'standard' },
  { key: 'contexto',  label: '¿Cuál fue la situación? (Contexto)',    type: 'textarea', required: true,  placeholder: 'Contanos brevemente qué pasó...', hint: 'Describí el contexto de la situación que querés analizar', category: 'standard' },
  { key: 'luces',     label: 'Luces ¿Qué hicieron bien?',            type: 'textarea', required: true,  placeholder: 'Escribí los aciertos, lo que funcionó...', hint: '¿Qué salió bien? ¿Cuáles fueron las buenas prácticas?', category: 'luces' },
  { key: 'sombras',   label: 'Sombras ¿Qué podrían haber hecho mejor?', type: 'textarea', required: true, placeholder: 'Mencioná las dificultades, los desvíos...', hint: '¿Qué se podría haber hecho mejor? ¿Qué fallas o trabas hubo?', category: 'sombras' },
  { key: 'comentarios', label: 'Comentarios, notas, ideas',           type: 'textarea', required: false, placeholder: 'Cualquier otra observación...', hint: 'Opcional', category: 'standard' },
]

// Create tables once on first import
let tablesReady = false
async function ensureTables() {
  if (tablesReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id          TEXT PRIMARY KEY,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status      TEXT NOT NULL DEFAULT 'saved',
      data        JSONB NOT NULL DEFAULT '{}'
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS form_config (
      id          INTEGER PRIMARY KEY DEFAULT 1,
      fields      JSONB NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  tablesReady = true
}

// Row → submission object used by the UI
function rowToSubmission(row) {
  return { id: row.id, createdAt: row.created_at, status: row.status, ...row.data }
}

// ── Public API (same signatures as before) ──────────────────────────────────

export function isConfigured() {
  return !!import.meta.env.VITE_DATABASE_URL
}

export async function loadSubmissions() {
  await ensureTables()
  const rows = await sql`SELECT * FROM submissions ORDER BY created_at DESC`
  return rows.map(rowToSubmission)
}

export async function saveSubmission(submission) {
  await ensureTables()
  const { id, createdAt, status, ...fields } = submission
  await sql`
    INSERT INTO submissions (id, created_at, status, data)
    VALUES (${id}, ${createdAt || new Date().toISOString()}, ${status || 'saved'}, ${JSON.stringify(fields)})
    ON CONFLICT (id) DO UPDATE
      SET status = EXCLUDED.status,
          data   = EXCLUDED.data
  `
  return submission
}

export async function deleteSubmission(id) {
  await ensureTables()
  await sql`DELETE FROM submissions WHERE id = ${id}`
}

export async function loadFormConfig() {
  await ensureTables()
  const rows = await sql`SELECT fields FROM form_config WHERE id = 1`
  return rows.length ? rows[0].fields : DEFAULT_FIELDS
}

export async function saveFormConfig(fields) {
  await ensureTables()
  await sql`
    INSERT INTO form_config (id, fields, updated_at)
    VALUES (1, ${JSON.stringify(fields)}, NOW())
    ON CONFLICT (id) DO UPDATE
      SET fields     = EXCLUDED.fields,
          updated_at = EXCLUDED.updated_at
  `
}

export async function testConnection() {
  const rows = await sql`SELECT NOW() AS now`
  return { ok: true, time: rows[0].now }
}

export function getShareableLink(type, id = null) {
  const base = `${window.location.origin}${window.location.pathname}`
  if (type === 'form') return `${base}?fill=true`
  if (type === 'submission' && id) return `${base}?id=${id}`
  return base
}
