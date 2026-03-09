// ═══════════════════════════════════════════════════════
//  game.js  —  core game actions & state mutations
// ═══════════════════════════════════════════════════════

let G = null;   // global game state (set after load)

// ── INIT ──────────────────────────────────────────────
async function initGame() {
  const tg     = window.Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;
  const userId = tgUser?.id ? String(tgUser.id) : null;
  const refId  = tg?.initDataUnsafe?.start_param || new URLSearchParams(location.search).get('startapp');

  // Try server load first (Telegram users) — with 5s timeout
  let serverData = null;
  if (userId && tg?.initData) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ initData: tg.initData, ref: refId }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      serverData = await r.json();
    } catch(e) {
      console.warn('[initGame] server auth failed, running offline:', e.message);
    }
  }

  // Load or create state
  G = loadGame(userId) || defaultState(userId);
  G.userId = userId;

  // Merge server data if available
  if (serverData?.ok) {
    G.coins   = Math.max(G.coins, serverData.user.coins || 0);
    G.tokens  = Math.max(G.tokens, serverData.user.tokens || 0);
    if (serverData.isNew) {
      // Airdrop for registration
      G.tokens += AIRDROP.registration;
      G.totalTokensEarned += AIRDROP.registration;
      showToast(`🎉 Welcome! +${AIRDROP.registration} ZOO_TOKEN airdrop!`);
    }
    if (serverData.offlineEarned > 0) {
      G.coins += serverData.offlineEarned;
    }
  }

  // Apply offline earnings from local save
  const offline = applyOfflineEarnings(G);
  if (offline.earned > 0) {
    UI.showOfflineBanner(offline.earned, offline.tokenEarned, offline.secsAway);
  }

  // Check milestones
  checkAndAwardMilestones();

  // Start income tick
  startIncomeTick();

  // Start token passive tick
  startTokenTick();

  // Auto-save
  startAutoSave(G, 10000);

  // TG setup
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#07080f');
    tg.setBackgroundColor('#07080f');
  }

  // Render initial UI
  UI.renderAll();
}

// ── INCOME TICK ───────────────────────────────────────
let _incomeTimer = null;
function startIncomeTick() {
  if (_incomeTimer) clearInterval(_incomeTimer);
  _incomeTimer = setInterval(() => {
    const inc = calcTotalIncome(G);
    G.coins             += inc;
    G.totalCoinsEarned  += inc;
    G.income             = inc;
    UI.updateHUD();
    checkAndAwardMilestones();
  }, 1000);
}

// ── TOKEN PASSIVE TICK ────────────────────────────────
let _tokenTimer = null;
function startTokenTick() {
  if (_tokenTimer) clearInterval(_tokenTimer);
  _tokenTimer = setInterval(() => {
    const rate = calcPassiveTokenRate(G);
    if (rate > 0) {
      G.tokens            += rate;
      G.totalTokensEarned += rate;
      G.passiveTokens     += rate;
      UI.updateTokenHUD();
    }
  }, 60000); // every minute
}

// ── BUY ANIMAL ────────────────────────────────────────
function buyAnimal(animalId, event) {
  const def = ANIMALS.find(a => a.id === animalId);
  if (!def) return;

  const capacity = getZooCapacity(G);
  const placed   = G.slots.filter(Boolean).length;

  if (G.coins < def.price) {
    showToast('❌ Not enough coins!');
    return false;
  }

  G.coins -= def.price;
  G.totalCoinsEarned; // (not adding here, already tracked on income)

  // Add to owned catalog
  if (!G.owned[animalId]) G.owned[animalId] = { id: animalId, count: 0, maxLevel: 1 };
  G.owned[animalId].count++;

  // Auto-place in first empty slot
  if (placed < capacity) {
    const emptyIdx = G.slots.findIndex(s => !s);
    if (emptyIdx !== -1) {
      G.slots[emptyIdx] = { id: animalId, level: 1 };
    }
  }

  // Token airdrop for purchase
  const tokenReward = AIRDROP.animalPurchase(def.tier);
  if (tokenReward > 0) {
    G.tokens            += tokenReward;
    G.totalTokensEarned += tokenReward;
    showToast(`${def.emoji} ${def.name} purchased! +${tokenReward} 🪙ZOO`);
  } else {
    showToast(`${def.emoji} ${def.name} purchased!`);
  }

  if (event) UI.spawnCoinFloat(event);

  G.income = calcTotalIncome(G);
  saveGame(G);
  checkAndAwardMilestones();
  UI.renderAll();
  return true;
}

// ── UPGRADE ANIMAL ────────────────────────────────────
function upgradeAnimal(slotIdx, event) {
  const slot = G.slots[slotIdx];
  if (!slot) return;

  const def  = ANIMALS.find(a => a.id === slot.id);
  if (!def) return;

  const currentLevel = slot.level || 1;
  if (currentLevel >= 50) { showToast('✅ Max level!'); return; }

  const cost = calcUpgradeCost(def, currentLevel);
  if (G.coins < cost) {
    showToast(`❌ Need ${fmtN(cost)} coins!`);
    return false;
  }

  G.coins   -= cost;
  slot.level = currentLevel + 1;

  // Update owned max level
  if (G.owned[slot.id]) {
    G.owned[slot.id].maxLevel = Math.max(G.owned[slot.id].maxLevel, slot.level);
  }

  G.totalLevels = (G.totalLevels || 0) + 1;

  // Token for level milestone
  const tokenLvl = AIRDROP.levelUp(slot.level);
  if (tokenLvl > 0) {
    G.tokens            += tokenLvl;
    G.totalTokensEarned += tokenLvl;
    showToast(`⬆️ ${def.name} → Lv${slot.level}! +${tokenLvl} 🪙ZOO`);
  } else {
    showToast(`⬆️ ${def.name} upgraded to Level ${slot.level}!`);
  }

  if (event) UI.spawnLevelFloat(event, slot.level);

  G.income = calcTotalIncome(G);
  saveGame(G);
  checkAndAwardMilestones();
  UI.renderAll();
  return true;
}

// ── BUY GLOBAL UPGRADE ────────────────────────────────
function buyGlobalUpgrade(upgradeId, event) {
  const upg  = GLOBAL_UPGRADES.find(u => u.id === upgradeId);
  if (!upg) return;

  const curLvl = G.upgrades[upgradeId] || 0;
  if (curLvl >= upg.maxLevel) { showToast('✅ Max level!'); return; }

  const cost = calcGlobalUpgradeCost(upgradeId, curLvl);
  if (G.coins < cost) {
    showToast(`❌ Need ${fmtN(cost)} coins!`);
    return false;
  }

  G.coins -= cost;
  G.upgrades[upgradeId] = curLvl + 1;

  showToast(`${upg.emoji} ${upg.name} upgraded to Lv${curLvl+1}!`);
  if (event) UI.spawnCoinFloat(event);

  G.income = calcTotalIncome(G);
  saveGame(G);
  UI.renderAll();
  return true;
}

// ── MOVE ANIMAL ───────────────────────────────────────
function moveAnimal(fromIdx, toIdx) {
  if (fromIdx === toIdx) return;
  const tmp        = G.slots[toIdx];
  G.slots[toIdx]   = G.slots[fromIdx];
  G.slots[fromIdx] = tmp;
  saveGame(G);
  UI.renderMap();
}

// ── REMOVE ANIMAL FROM SLOT ───────────────────────────
function removeFromSlot(slotIdx) {
  G.slots[slotIdx] = null;
  G.income = calcTotalIncome(G);
  saveGame(G);
  UI.renderAll();
}



// ── CASES (LOOT BOXES) ───────────────────────────────
function openCase(caseId) {
  const caseDef = CASES.find(c => c.id === caseId);
  if (!caseDef) return false;
  if (G.coins < caseDef.price) {
    showToast('❌ Not enough coins for this case');
    return false;
  }

  G.coins -= caseDef.price;

  const rarity = rollRarity(caseDef);
  const animal = randomAnimalFromTier(rarity);
  if (!animal) {
    showToast('❌ No animals for this rarity yet');
    return false;
  }

  const stats = generateStats(rarity);
  const income = Math.floor(calcGeneratedIncome(animal.profit, rarity, stats));
  const instance = {
    uid: Date.now() + Math.floor(Math.random() * 100000),
    id: animal.id,
    generatedTier: rarity,
    generatedStats: stats,
    income,
    sourceCase: caseId,
    listed: false,
  };

  G.animalInstances.push(instance);

  if (!G.owned[animal.id]) G.owned[animal.id] = { id: animal.id, count: 0, maxLevel: 1 };
  G.owned[animal.id].count++;
  G.owned[animal.id].maxLevel = Math.max(G.owned[animal.id].maxLevel, stats.level);

  const capacity = getZooCapacity(G);
  const placed = G.slots.filter(Boolean).length;
  if (placed < capacity) {
    const emptyIdx = G.slots.findIndex(s => !s);
    if (emptyIdx !== -1) {
      G.slots[emptyIdx] = {
        id: animal.id,
        level: stats.level,
        uid: instance.uid,
        generatedTier: rarity,
        generatedStats: stats,
      };
    }
  }

  G.income = calcTotalIncome(G);
  saveGame(G);
  UI.renderAll();
  showToast(`${animal.emoji} ${animal.name} (${rarity.toUpperCase()}) +${fmtN(income)}/s`);
  return instance;
}

function listAnimalOnMarket(uid, price) {
  const inst = G.animalInstances.find(x => x.uid === uid);
  if (!inst || inst.listed) return false;

  inst.listed = true;
  G.marketListings.push({
    listingId: Date.now() + Math.floor(Math.random() * 10000),
    sellerId: G.userId || 'local-player',
    uid: inst.uid,
    id: inst.id,
    generatedTier: inst.generatedTier,
    generatedStats: inst.generatedStats,
    income: inst.income,
    price,
  });

  saveGame(G);
  UI.renderAll();
  showToast('📦 Animal listed on marketplace');
  return true;
}

function buyMarketListing(listingId) {
  const idx = G.marketListings.findIndex(x => x.listingId === listingId);
  if (idx === -1) return false;

  const listing = G.marketListings[idx];
  if (G.coins < listing.price) {
    showToast('❌ Not enough coins');
    return false;
  }

  G.coins -= listing.price;
  const instance = {
    uid: Date.now() + Math.floor(Math.random() * 100000),
    id: listing.id,
    generatedTier: listing.generatedTier,
    generatedStats: listing.generatedStats,
    income: listing.income,
    sourceCase: 'market',
    listed: false,
  };

  G.marketListings.splice(idx, 1);
  G.animalInstances.push(instance);

  if (!G.owned[instance.id]) G.owned[instance.id] = { id: instance.id, count: 0, maxLevel: 1 };
  G.owned[instance.id].count++;
  G.owned[instance.id].maxLevel = Math.max(G.owned[instance.id].maxLevel, instance.generatedStats.level);

  saveGame(G);
  UI.renderAll();
  showToast('✅ Bought from marketplace');
  return true;
}

function requestTrade(uid) {
  const inst = G.animalInstances.find(x => x.uid === uid);
  if (!inst) return false;
  showToast('🤝 Trade request sent (demo)');
  return true;
}
// ── DAILY REWARD ──────────────────────────────────────
function claimDailyReward() {
  const now = Date.now();
  const msDay = 86400000;

  if (G.lastDailyClaim && (now - G.lastDailyClaim) < msDay) {
    const nextIn = msDay - (now - G.lastDailyClaim);
    const h = Math.floor(nextIn / 3600000);
    const m = Math.floor((nextIn % 3600000) / 60000);
    showToast(`⏰ Come back in ${h}h ${m}m`);
    return false;
  }

  // Reset streak if >48h gap
  if (G.lastDailyClaim && (now - G.lastDailyClaim) > msDay * 2) {
    G.streak = 0;
  }

  const reward = getDailyReward(G.streak);
  G.coins             += reward.coins;
  G.tokens            += reward.tokens + AIRDROP.dailyClaim;
  G.totalCoinsEarned  += reward.coins;
  G.totalTokensEarned += reward.tokens + AIRDROP.dailyClaim;
  G.streak            += 1;
  G.lastDailyClaim     = now;

  // 4-hour daily boost
  G.dailyBoostActive  = true;
  G.dailyBoostExpiry  = now + 4 * 3600000;

  setTimeout(() => {
    G.dailyBoostActive = false;
    G.income = calcTotalIncome(G);
  }, 4 * 3600000);

  UI.showDailyClaimAnimation(reward);
  saveGame(G);
  checkAndAwardMilestones();
  UI.renderAll();
  return true;
}

// ── MILESTONES ────────────────────────────────────────
function checkAndAwardMilestones() {
  const triggered = checkMilestones(G);
  for (const m of triggered) {
    G.earnedMilestones.push(m.key);
    G.coins             += m.coins;
    G.tokens            += m.tokens;
    G.totalCoinsEarned  += m.coins;
    G.totalTokensEarned += m.tokens;
    if (m.tokens > 0 || m.coins > 0) {
      UI.showMilestone(m);
    }
  }
}

// ── REFERRAL ──────────────────────────────────────────
function getReferralLink() {
  const botName = window.__BOT_NAME__ || 'cryptozoo_bot';
  return `https://t.me/${botName}/app?startapp=${G.userId || 'guest'}`;
}

function copyReferralLink() {
  const link = getReferralLink();
  navigator.clipboard.writeText(link)
    .then(() => showToast('🔗 Link copied!'))
    .catch(() => showToast('🔗 ' + link));
}

// ── TOAST ─────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}