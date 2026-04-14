export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'No session id provided.' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'Session storage not configured.' });
  }

  const r = await fetch(`${kvUrl}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', id])
  });

  if (!r.ok) {
    return res.status(500).json({ error: 'KV read failed.' });
  }

  const data = await r.json();
  if (!data.result) return res.status(404).json({ error: 'Session not found or expired.' });

  let state;
  try {
    state = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch {
    return res.status(500).json({ error: 'Could not parse saved session.' });
  }

  return res.status(200).json({ state });
}
