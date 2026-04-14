import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'Session storage not configured (KV_REST_API_URL / KV_REST_API_TOKEN missing).' });
  }

  const { state } = req.body;
  if (!state) return res.status(400).json({ error: 'No state provided.' });

  const id = randomUUID();
  const value = typeof state === 'string' ? state : JSON.stringify(state);

  // Store with 90-day expiry (7,776,000 seconds)
  const r = await fetch(`${kvUrl}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', id, value, 'EX', 7776000])
  });

  if (!r.ok) {
    const err = await r.text();
    return res.status(500).json({ error: `KV write failed: ${err}` });
  }

  return res.status(200).json({ id });
}
