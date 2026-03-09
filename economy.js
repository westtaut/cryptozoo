// ═══════════════════════════════════════════════════════
//  economy.js  —  all game formulas & economic logic
// ═══════════════════════════════════════════════════════

// ── UPGRADE DEFINITIONS ───────────────────────────────
const GLOBAL_UPGRADES = [
  {
    id: "income_booster",
    name: "Income Booster",
    emoji: "📈",
    desc: "Multiply ALL animal income",
    maxLevel: 20,
    baseCost: 5000,
    effectPerLevel: 0.1,   // +10% per level
    costFormula: (lvl) => Math.floor(5000 * Math.pow(1.15, lvl)),
    effectLabel: (lvl) => `×${(1 + lvl * 0.1).toFixed(1)} income`,
  },
  {
    id: "zoo_capacity",
    name: "Zoo Capacity",
    emoji: "🏗️",
    desc: "Unlock more animal slots",
    maxLevel: 3,
    baseCost: 10000,
    extraSlots: [0, 10, 20, 30],  // added slots per level
    costFormula: (lvl) => [10000, 50000, 200000][lvl] ?? Infinity,
    effectLabel: (lvl) => `${50 + (lvl * 10)} total slots`,
  },
  {
    id: "offline_booster",
    name: "Offline Earnings",
    emoji: "😴",
    desc: "Earn more while away",
    maxLevel: 5,
    baseCost: 8000,
    costFormula: (lvl) => Math.floor(8000 * Math.pow(1.5, lvl)),
    effectLabel: (lvl) => `${[2,4,6,8,10,12][lvl]}h offline cap`,
  },
  {
    id: "token_booster",
    name: "Token Booster",
    emoji: "🪙",
    desc: "Multiply ZOO_TOKEN earnings",
    maxLevel: 10,
    baseCost: 15000,
    costFormula: (lvl) => Math.floor(15000 * Math.pow(1.2, lvl)),
    effectLabel: (lvl) => `×${(1 + lvl * 0.2).toFixed(1)} tokens`,
  },
  {
    id: "prestige",
    name: "Prestige",
    emoji: "⭐",
    desc: "Reset progress for permanent bonus",
    maxLevel: 5,
    baseCost: 1000000,
    costFormula: (lvl) => Math.floor(1000000 * Math.pow(5, lvl)),
    effectLabel: (lvl) => `×${[1,2,5,10,20,50][lvl]} all income`,
  },
];

// ── ECONOMY FORMULAS ───────────────────────────────────

/**
 * Animal income per second
 * income = base_profit × animal_level_mult × global_boost × prestige_mult × daily_boost
 */
function calcAnimalIncome(animal, animalLevel, G) {
  const def = ANIMALS.find(a => a.id === animal.id);
  if (!def) return 0;
  const levelMult   = 1 + (animalLevel - 1) * 0.15;       // +15% per level
  const globalBoost = 1 + (G.upgrades.income_booster || 0) * 0.1;
  const prestigeMult= [1,2,5,10,20,50][G.upgrades.prestige || 0] || 1;
  const dailyBoost  = G.dailyBoostActive ? 1.5 : 1;
  return def.profit * levelMult * globalBoost * prestigeMult * dailyBoost;
}

/**
 * Total income per second for all placed animals
 */
function calcTotalIncome(G) {
  return G.slots.reduce((sum, slot) => {
    if (!slot) return sum;
    return sum + calcAnimalIncome(slot, slot.level || 1, G);
  }, 0);
}

/**
 * Cost to upgrade an animal to next level
 * cost = base_price × 1.15^(current_level - 1)
 */
function calcUpgradeCost(animalDef, currentLevel) {
  return Math.floor(animalDef.price * Math.pow(1.15, currentLevel - 1));
}

/**
 * Cost of next global upgrade level
 */
function calcGlobalUpgradeCost(upgradeId, currentLevel) {
  const upg = GLOBAL_UPGRADES.find(u => u.id === upgradeId);
  if (!upg) return Infinity;
  return upg.costFormula(currentLevel);
}

/**
 * Token reward formula
 * token_reward = floor(total_income / 10000) × token_booster_mult
 */
function calcTokenReward(totalIncome, G) {
  const boosterMult = 1 + (G.upgrades.token_booster || 0) * 0.2;
  return Math.floor((totalIncome / 10000) * boosterMult);
}

/**
 * Passive token accrual per minute (Hamster Kombat style)
 */
function calcPassiveTokenRate(G) {
  const income = calcTotalIncome(G);
  const boosterMult = 1 + (G.upgrades.token_booster || 0) * 0.2;
  return Math.floor((income / 500) * boosterMult * 0.01);
}

/**
 * Offline earnings (capped by upgrade level)
 */
function calcOfflineEarnings(G, secondsAway) {
  const capHours = [2, 4, 6, 8, 10, 12][G.upgrades.offline_booster || 0] || 2;
  const cappedSeconds = Math.min(secondsAway, capHours * 3600);
  return Math.floor(calcTotalIncome(G) * cappedSeconds);
}

/**
 * Zoo capacity based on upgrade level
 */
function getZooCapacity(G) {
  return 50 + (G.upgrades.zoo_capacity || 0) * 10;
}



// ── LOOT BOX + GENERATED STATS ───────────────────────
const LOOT_BOXES = [
  {
    id: 'basic',
    name: 'Basic Crate',
    emoji: '📦',
    price: 5000,
    odds: { common: 0.75, rare: 0.2, epic: 0.045, legendary: 0.005 },
    statRoll: { min: 0.85, max: 1.2 },
  },
  {
    id: 'premium',
    name: 'Premium Crate',
    emoji: '🎁',
    price: 50000,
    odds: { common: 0.45, rare: 0.35, epic: 0.17, legendary: 0.03 },
    statRoll: { min: 0.95, max: 1.4 },
  },
  {
    id: 'mythic',
    name: 'Mythic Vault',
    emoji: '🧰',
    price: 250000,
    odds: { common: 0.2, rare: 0.35, epic: 0.35, legendary: 0.1 },
    statRoll: { min: 1.05, max: 1.75 },
  },
];

function getLootBox(boxId) {
  return LOOT_BOXES.find(b => b.id === boxId);
}

function pickTierByOdds(odds) {
  const r = Math.random();
  let acc = 0;
  for (const [tier, prob] of Object.entries(odds)) {
    acc += prob;
    if (r <= acc) return tier;
  }
  return 'common';
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAnimalFromBox(boxDef, uid) {
  const tier = pickTierByOdds(boxDef.odds);
  const pool = ANIMALS.filter(a => a.tier === tier);
  const base = randomFrom(pool) || ANIMALS[0];

  const min = boxDef.statRoll.min;
  const max = boxDef.statRoll.max;
  const statMult = +(min + (max - min) * Math.random()).toFixed(2);
  const priceMult = +(0.85 + statMult * 0.4).toFixed(2);

  return {
    uid,
    animalId: base.id,
    name: base.name,
    emoji: base.emoji,
    tier: base.tier,
    baseProfit: base.profit,
    statMult,
    marketValue: Math.floor(base.price * priceMult),
    createdAt: Date.now(),
  };
}

function generatedIncome(animal) {
  return Math.floor((animal.baseProfit || 0) * (animal.statMult || 1));
}

// ── MILESTONES ────────────────────────────────────────
const MILESTONES = [
  // [threshold_type, threshold_value, token_reward, coin_reward, label]
  { type:"coins",      value:1000,       tokens:10,   coins:0,      label:"First 1K coins!" },
  { type:"coins",      value:10000,      tokens:25,   coins:0,      label:"10K coins!" },
  { type:"coins",      value:100000,     tokens:50,   coins:0,      label:"100K coins!" },
  { type:"coins",      value:1000000,    tokens:100,  coins:0,      label:"Millionaire!" },
  { type:"coins",      value:10000000,   tokens:250,  coins:0,      label:"10M coins!" },
  { type:"animals",    value:1,          tokens:5,    coins:100,    label:"First animal!" },
  { type:"animals",    value:5,          tokens:15,   coins:500,    label:"5 animals!" },
  { type:"animals",    value:10,         tokens:30,   coins:1000,   label:"10 animals!" },
  { type:"animals",    value:25,         tokens:75,   coins:5000,   label:"Half zoo!" },
  { type:"animals",    value:50,         tokens:200,  coins:20000,  label:"Full zoo!" },
  { type:"income",     value:100,        tokens:10,   coins:0,      label:"100/s income!" },
  { type:"income",     value:1000,       tokens:30,   coins:0,      label:"1K/s income!" },
  { type:"income",     value:10000,      tokens:80,   coins:0,      label:"10K/s income!" },
  { type:"income",     value:100000,     tokens:200,  coins:0,      label:"100K/s income!" },
  { type:"rare",       value:1,          tokens:20,   coins:2000,   label:"First rare!" },
  { type:"epic",       value:1,          tokens:50,   coins:10000,  label:"First epic!" },
  { type:"legendary",  value:1,          tokens:200,  coins:100000, label:"First legendary!" },
  { type:"streak",     value:7,          tokens:50,   coins:5000,   label:"7-day streak!" },
  { type:"streak",     value:30,         tokens:300,  coins:50000,  label:"30-day streak!" },
  { type:"level",      value:50,         tokens:1,    coins:0,      label:"Level 50 milestone" },
  { type:"level",      value:100,        tokens:1,    coins:0,      label:"Level 100 milestone" },
  { type:"referrals",  value:1,          tokens:25,   coins:500,    label:"First referral!" },
  { type:"referrals",  value:5,          tokens:100,  coins:2000,   label:"5 referrals!" },
  { type:"referrals",  value:10,         tokens:250,  coins:5000,   label:"10 referrals!" },
];

/**
 * Check and award any newly-reached milestones
 * Returns array of newly triggered milestones
 */
function checkMilestones(G) {
  const earned = G.earnedMilestones || [];
  const triggered = [];

  for (const m of MILESTONES) {
    const key = `${m.type}_${m.value}`;
    if (earned.includes(key)) continue;

    let reached = false;
    if      (m.type === "coins")     reached = G.totalCoinsEarned >= m.value;
    else if (m.type === "animals")   reached = G.slots.filter(Boolean).length >= m.value;
    else if (m.type === "income")    reached = calcTotalIncome(G) >= m.value;
    else if (m.type === "rare")      reached = G.slots.filter(s => s && ANIMALS.find(a=>a.id===s.id)?.tier === "rare").length >= m.value;
    else if (m.type === "epic")      reached = G.slots.filter(s => s && ANIMALS.find(a=>a.id===s.id)?.tier === "epic").length >= m.value;
    else if (m.type === "legendary") reached = G.slots.filter(s => s && ANIMALS.find(a=>a.id===s.id)?.tier === "legendary").length >= m.value;
    else if (m.type === "streak")    reached = G.streak >= m.value;
    else if (m.type === "level")     reached = (G.totalLevels || 0) >= m.value;
    else if (m.type === "referrals") reached = (G.referralCount || 0) >= m.value;

    if (reached) triggered.push({...m, key});
  }
  return triggered;
}

// ── DAILY REWARD SCHEDULE ─────────────────────────────
const DAILY_REWARDS = [
  { day:1,  coins:1000,   tokens:5,   label:"Day 1" },
  { day:2,  coins:1500,   tokens:8,   label:"Day 2" },
  { day:3,  coins:2000,   tokens:10,  label:"Day 3" },
  { day:4,  coins:3000,   tokens:15,  label:"Day 4" },
  { day:5,  coins:5000,   tokens:20,  label:"Day 5" },
  { day:6,  coins:8000,   tokens:30,  label:"Day 6" },
  { day:7,  coins:15000,  tokens:50,  label:"Day 7 🎉", special: true },
];

function getDailyReward(streak) {
  const idx = Math.min((streak % 7), DAILY_REWARDS.length - 1);
  return DAILY_REWARDS[idx];
}

// ── REFERRAL ──────────────────────────────────────────
const REFERRAL = {
  newUserBonus:      500,     // coins for new user
  referrerCoins:     1000,    // coins for referrer
  newUserTokens:     20,      // tokens for new user
  referrerTokens:    30,      // tokens for referrer
  incomePercent:     0.05,    // 5% of referee's income per hour bonus
};

// ── AIRDROP CONFIG ────────────────────────────────────
const AIRDROP = {
  registration:      100,     // tokens on first join
  dailyClaim:        2,       // base tokens per daily claim
  animalPurchase:    (tier) => ({common:1, rare:3, epic:8, legendary:20}[tier] || 0),
  levelUp:           (newLevel) => newLevel % 10 === 0 ? 5 : 0,
};

// ── HELPER: format numbers ────────────────────────────
function fmtN(n) {
  n = Math.floor(n);
  if (n >= 1e15) return (n/1e15).toFixed(2) + 'Q';
  if (n >= 1e12) return (n/1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(2)  + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + 'K';
  return n.toString();
}

function fmtTokens(n) {
  return fmtN(n);
}