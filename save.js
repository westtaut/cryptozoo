// ═══════════════════════════════════════════════════════
//  save.js  —  save/load game state + offline earnings
// ═══════════════════════════════════════════════════════

const SAVE_KEY  = 'czoo_v2_save';
const SAVE_VER  = 2;

// ── DEFAULT STATE ─────────────────────────────────────
function defaultState(userId) {
  return {
    ver:              SAVE_VER,
    userId:           userId || null,
    coins:            0,
    tokens:           0,
    totalCoinsEarned: 0,
    income:           0,

    // 50 slots (null = empty, object = placed animal)
    slots: new Array(50).fill(null),

    // Owned animal catalog: { animalId: { id, count, maxLevel } }
    owned: {},
    animalInstances: [],

    // Marketplace
    marketListings: [],

    // Global upgrades: { upgradeId: level }
    upgrades: {
      income_booster:  0,
      zoo_capacity:    0,
      offline_booster: 0,
      token_booster:   0,
      prestige:        0,
    },

    // Daily reward
    streak:          0,
    lastDailyClaim:  0,
    dailyBoostActive:false,
    dailyBoostExpiry:0,

    // Tokens / airdrop
    totalTokensEarned: 0,
    passiveTokens:     0,
    lastTokenTick:     0,

    // Milestones
    earnedMilestones: [],
    totalLevels:      0,

    // Referral
    referralCount:    0,
    referralEarned:   0,

    // Timestamps
    lastSave:         Date.now(),
    lastOnline:       Date.now(),
    isNew:            true,
  };
}

// ── SAVE ──────────────────────────────────────────────
function saveGame(G) {
  try {
    G.lastSave   = Date.now();
    G.lastOnline = Date.now();
    G.income     = calcTotalIncome(G);
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch(e) {
    console.warn('[save] failed', e);
  }
}

// ── LOAD ──────────────────────────────────────────────
function loadGame(userId) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.ver !== SAVE_VER) return null;

    // Merge defaults for any missing keys
    const def = defaultState(userId);
    const G   = Object.assign({}, def, saved);

    // Ensure slots array is correct length
    while (G.slots.length < 50) G.slots.push(null);
    if (!Array.isArray(G.animalInstances)) G.animalInstances = [];
    if (!Array.isArray(G.marketListings)) G.marketListings = [];

    return G;
  } catch(e) {
    console.warn('[load] failed', e);
    return null;
  }
}

// ── OFFLINE EARNINGS ──────────────────────────────────
function applyOfflineEarnings(G) {
  const now        = Date.now();
  const secsAway   = Math.floor((now - G.lastOnline) / 1000);
  if (secsAway < 10) return { earned: 0, tokenEarned: 0, secsAway: 0 };

  const earned      = calcOfflineEarnings(G, secsAway);
  const tokenEarned = Math.floor(calcPassiveTokenRate(G) * (secsAway / 60));

  G.coins           += earned;
  G.tokens          += tokenEarned;
  G.totalCoinsEarned+= earned;
  G.totalTokensEarned+=tokenEarned;
  G.lastOnline       = now;
  G.lastTokenTick    = now;

  return { earned, tokenEarned, secsAway };
}

// ── AUTO-SAVE LOOP ────────────────────────────────────
let _saveTimer = null;
function startAutoSave(G, intervalMs = 10000) {
  if (_saveTimer) clearInterval(_saveTimer);
  _saveTimer = setInterval(() => saveGame(G), intervalMs);
}
function stopAutoSave() {
  if (_saveTimer) clearInterval(_saveTimer);
  _saveTimer = null;
}

// ── SERVER SYNC (optional Supabase) ───────────────────
async function syncToServer(G) {
  if (!G.userId) return;
  try {
    await fetch('/api/game', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        userId:   G.userId,
        coins:    Math.floor(G.coins),
        tokens:   Math.floor(G.tokens),
        income:   Math.floor(G.income),
        inventory:G.slots.filter(Boolean),
        upgrades: G.upgrades,
        streak:   G.streak,
        lastDaily:G.lastDailyClaim,
      })
    });
  } catch(e) {
    console.warn('[syncToServer] failed, saving locally only');
  }
}

async function loadFromServer(userId) {
  try {
    const r = await fetch(`/api/game?userId=${userId}`);
    const d = await r.json();
    if (!d.ok) return null;
    return d;
  } catch(e) {
    return null;
  }
}