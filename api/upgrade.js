import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Конфиг всех прокачек
export const UPGRADES_CONFIG = {
  autocollector: {
    name: 'Auto-Collector',
    emoji: '🤖',
    description: 'Boosts income (works offline too)',
    maxLevel: 4,
    levels: [
      { level: 1, cost: 500,   bonus: '+10% income',  multiplier: 1.1  },
      { level: 2, cost: 2000,  bonus: '+25% income',  multiplier: 1.25 },
      { level: 3, cost: 8000,  bonus: '+50% income',  multiplier: 1.5  },
      { level: 4, cost: 25000, bonus: '+100% income', multiplier: 2.0  },
    ],
  },
  capacity: {
    name: 'Zoo Capacity',
    emoji: '🏗️',
    description: 'Unlock more animal slots',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 1000,  bonus: '50 slots',  slots: 50  },
      { level: 2, cost: 5000,  bonus: '100 slots', slots: 100 },
      { level: 3, cost: 20000, bonus: '200 slots', slots: 200 },
    ],
  },
  prestige: {
    name: 'Prestige',
    emoji: '⭐',
    description: 'Multiplies ALL animal profits',
    maxLevel: 3,
    levels: [
      { level: 1, cost: 5000,  bonus: 'All profits ×2', multiplier: 2 },
      { level: 2, cost: 30000, bonus: 'All profits ×5', multiplier: 5 },
      { level: 3, cost: 100000,bonus: 'All profits ×10',multiplier: 10 },
    ],
  },
};

// POST /api/upgrade — купить следующий уровень прокачки
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, type } = req.body;
  if (!userId || !type) return res.status(400).json({ error: 'userId and type required' });

  const config = UPGRADES_CONFIG[type];
  if (!config) return res.status(400).json({ error: 'Unknown upgrade type' });

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const currentLevel = user.upgrades?.[type] || 0;
  if (currentLevel >= config.maxLevel) {
    return res.status(400).json({ error: 'Already max level' });
  }

  const nextLevel = config.levels[currentLevel]; // 0-indexed = next level to buy
  if (user.coins < nextLevel.cost) {
    return res.status(400).json({ error: 'Not enough coins' });
  }

  const newUpgrades = { ...user.upgrades, [type]: currentLevel + 1 };
  let newIncome = user.income;

  // Пересчитываем доход если prestige
  if (type === 'prestige') {
    const prevMultiplier = currentLevel > 0 ? config.levels[currentLevel - 1].multiplier : 1;
    const newMultiplier = nextLevel.multiplier;
    newIncome = Math.floor((user.income / prevMultiplier) * newMultiplier);
  }

  await supabase
    .from('users')
    .update({
      coins: user.coins - nextLevel.cost,
      income: newIncome,
      upgrades: newUpgrades,
    })
    .eq('id', userId);

  return res.json({
    ok: true,
    newLevel: currentLevel + 1,
    coinsSpent: nextLevel.cost,
    upgrades: newUpgrades,
    income: newIncome,
  });
}
