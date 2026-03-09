import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const AUTO_MULT = [1, 1.1, 1.25, 1.5, 2.0];
const MAX_OFFLINE_H = 8;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { initData, ref } = req.body;
  if (!initData) return res.status(400).json({ error: 'No initData' });

  const telegramUser = verifyTelegramAuth(initData);
  if (!telegramUser) return res.status(401).json({ error: 'Invalid Telegram auth' });

  const userId = String(telegramUser.id);

  const { data: existing } = await supabase
    .from('users').select('*').eq('id', userId).single();

  if (!existing) {
    const newUser = {
      id: userId,
      username: telegramUser.username || '',
      first_name: telegramUser.first_name || 'Player',
      coins: 0, income: 0, inventory: [],
      upgrades: { autocollector:0, capacity:0, prestige:0, daily_boost:0, ref_boost:0 },
      referrer_id: null, referral_count: 0,
      offline_collected_at: new Date().toISOString(),
    };

    if (ref && String(ref) !== userId) {
      const { data: referrer } = await supabase
        .from('users').select('id, coins, referral_count').eq('id', String(ref)).single();
      if (referrer) {
        newUser.referrer_id = String(ref);
        newUser.coins = 500;
        await supabase.from('users').update({
          coins: referrer.coins + 1000,
          referral_count: referrer.referral_count + 1,
        }).eq('id', String(ref));
      }
    }

    await supabase.from('users').insert(newUser);
    return res.json({ ok: true, user: newUser, isNew: true, offlineEarned: 0 });
  }

  // Offline earnings
  const now = Date.now();
  const lastCollect = new Date(existing.offline_collected_at || now).getTime();
  const secs = Math.min(Math.floor((now - lastCollect) / 1000), MAX_OFFLINE_H * 3600);
  const autoLvl = existing.upgrades?.autocollector || 0;
  const offlineEarned = Math.floor(existing.income * secs * (AUTO_MULT[autoLvl] || 1));

  const updatedCoins = existing.coins + offlineEarned;
  await supabase.from('users').update({
    coins: updatedCoins,
    offline_collected_at: new Date().toISOString(),
    username: telegramUser.username || existing.username || '',
    first_name: telegramUser.first_name || existing.first_name || 'Player',
  }).eq('id', userId);

  return res.json({
    ok: true,
    user: { ...existing, coins: updatedCoins },
    offlineEarned,
    isNew: false,
  });
}

function verifyTelegramAuth(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    const str = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`).join('\n');

    const secret = crypto.createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN).digest();
    const expected = crypto.createHmac('sha256', secret)
      .update(str).digest('hex');

    if (expected !== hash) return null;
    return JSON.parse(params.get('user'));
  } catch { return null; }
}