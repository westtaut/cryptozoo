import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — загрузить прогресс
  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'No userId' });

    const { data, error } = await supabase
      .from('users').select('*').eq('id', userId).single();

    if (error || !data) return res.status(404).json({ error: 'User not found' });
    return res.json({ ok: true, ...data });
  }

  // POST — сохранить прогресс
  if (req.method === 'POST') {
    const { userId, coins, income, inventory, upgrades } = req.body;
    if (!userId) return res.status(400).json({ error: 'No userId' });

    const { error } = await supabase.from('users').update({
      coins: Math.floor(coins || 0),
      income: Math.floor(income || 0),
      inventory: inventory || [],
      upgrades: upgrades || {},
      offline_collected_at: new Date().toISOString(),
    }).eq('id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}