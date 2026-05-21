import { put } from '@vercel/blob'

// Disable body parser so the raw stream goes directly to Vercel Blob
export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const filename = url.searchParams.get('filename') || 'upload'
  const contentType = req.headers['x-content-type'] || req.headers['content-type'] || 'video/mp4'

  try {
    // Pass req directly as stream — bypasses 4.5 MB body limit
    const blob = await put(filename, req, {
      access: 'public',
      contentType,
    })
    return res.status(200).json({ url: blob.url })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
