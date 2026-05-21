import { put } from '@vercel/blob'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename') || 'upload'

  const blob = await put(filename, request.body, {
    access: 'public',
    contentType: request.headers.get('x-content-type') || 'application/octet-stream',
  })

  return new Response(JSON.stringify({ url: blob.url }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
