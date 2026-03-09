import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/referral?userId=123 — статистика рефералов + реферальная ссылка
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'No userId' });

  const { data: user } = await supabase
    .from('users')
    .select('id, username, first_name, referral_count, coins')
    .eq('id', userId)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Список приглашённых игроков
  const { data: referrals } = await supabase
    .from('users')
    .select('id, first_name, username, created_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const botName = process.env.BOT_NAME || 'your_bot';
  const referralLink = `https://t.me/${botName}/app?startapp=${userId}`;

  return res.json({
    userId: user.id,
    referralCount: user.referral_count,
    referralLink,
    referrals: referrals || [],
    bonusPerReferral: { newUser: 500, referrer: 1000 },
  });
}
