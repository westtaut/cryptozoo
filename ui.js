// ═══════════════════════════════════════════════════════
//  ui.js  —  all rendering + popup + animations
// ═══════════════════════════════════════════════════════

const UI = {
  currentTab:    'map',
  currentPopup:  null,
  shopFilter:    'all',
  dragFrom:      null,

  // ── FULL RENDER ─────────────────────────────────────
  renderAll() {
    this.updateHUD();
    this.updateTokenHUD();
    if (this.currentTab === 'map')     this.renderMap();
    if (this.currentTab === 'shop')    this.renderShop();
    if (this.currentTab === 'animals') this.renderCollection();
    if (this.currentTab === 'upgrade') this.renderUpgrades();
    if (this.currentTab === 'daily')   this.renderDaily();
    if (this.currentTab === 'ref')     this.renderReferral();
    if (this.currentTab === 'tokens')  this.renderTokens();
    if (this.currentTab === 'loot')    this.renderLoot();
    if (this.currentTab === 'market')  this.renderMarketplace();
  },

  // ── HUD ─────────────────────────────────────────────
  updateHUD() {
    const inc = calcTotalIncome(G);
    setText('coins-val', fmtN(G.coins));
    setText('income-val', fmtN(inc));
    G.income = inc;

    // Daily boost badge
    const now = Date.now();
    const boostEl = document.getElementById('boost-badge');
    if (boostEl) {
      if (G.dailyBoostActive && G.dailyBoostExpiry > now) {
        const left = Math.floor((G.dailyBoostExpiry - now) / 60000);
        boostEl.textContent = `🔥 ×1.5 ${left}m`;
        boostEl.style.display = 'flex';
      } else {
        boostEl.style.display = 'none';
      }
    }
  },

  updateTokenHUD() {
    setText('token-val', fmtTokens(G.tokens));
    const rate = calcPassiveTokenRate(G);
    const rateEl = document.getElementById('token-rate');
    if (rateEl) rateEl.textContent = `+${rate}/min`;
  },

  // ── TAB SWITCH ───────────────────────────────────────
  switchTab(tab, btnEl) {
    this.currentTab = tab;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const sec = document.getElementById('sec-' + tab);
    if (sec) sec.classList.add('active');
    if (btnEl) btnEl.classList.add('active');
    this.renderAll();
    TG.haptic('light');
  },

  // ── MAP ─────────────────────────────────────────────
  renderMap() {
    const cap     = getZooCapacity(G);
    const placed  = G.slots.filter(Boolean).length;
    const grid    = document.getElementById('zoo-grid');
    if (!grid) return;

    // Stats
    setText('stat-animals', `${placed} / ${cap}`);
    setText('stat-income',  fmtN(calcTotalIncome(G)));
    setProgress('stat-fill', (placed / cap) * 100);

    // Offline bonus chips
    const inc  = calcTotalIncome(G);
    const capH = [2,4,6,8,10,12][G.upgrades.offline_booster||0]||2;
    setText('max-offline', fmtN(inc * capH * 3600));

    let html = '';
    for (let i = 0; i < cap; i++) {
      const slot = G.slots[i];
      if (slot) {
        const def   = ANIMALS.find(a => a.id === slot.id);
        const tc    = TIER_CONFIG[def?.tier || 'common'];
        const lvl   = slot.level || 1;
        const slotInc = calcAnimalIncome(slot, lvl, G);
        html += `
          <div class="zoo-slot filled tier-${def?.tier}"
               style="--tc:${tc.color};--tg:${tc.glow}"
               onclick="UI.openAnimalPopup(${i})"
               draggable="true"
               ondragstart="UI.dragStart(${i})"
               ondragover="event.preventDefault()"
               ondrop="UI.dragDrop(${i})">
            <span class="slot-emoji">${def?.emoji||'❓'}</span>
            <span class="slot-name">${(def?.name||'').substring(0,7)}</span>
            <span class="slot-lvl">Lv${lvl}</span>
            <span class="slot-inc">+${fmtN(slotInc)}</span>
          </div>`;
      } else if (i < getZooCapacity(G)) {
        html += `
          <div class="zoo-slot empty"
               ondragover="event.preventDefault()"
               ondrop="UI.dragDrop(${i})"
               onclick="UI.switchTab('shop', document.querySelector('[data-tab=shop]'))">
            <span class="slot-plus">+</span>
          </div>`;
      }
    }
    grid.innerHTML = html;
  },

  // Drag & drop reorder
  dragStart(idx) { this.dragFrom = idx; },
  dragDrop(toIdx) {
    if (this.dragFrom !== null && this.dragFrom !== toIdx) {
      moveAnimal(this.dragFrom, toIdx);
    }
    this.dragFrom = null;
  },

  // ── SHOP ────────────────────────────────────────────
  renderShop() {
    const list = document.getElementById('shop-list');
    if (!list) return;

    const filter = this.shopFilter;
    const animals = filter === 'all'
      ? ANIMALS
      : ANIMALS.filter(a => a.tier === filter);

    if (!animals.length) {
      list.innerHTML = '<div class="empty-state">Nothing here 🔍</div>';
      return;
    }

    list.innerHTML = animals.map(a => {
      const tc      = TIER_CONFIG[a.tier];
      const canBuy  = G.coins >= a.price;
      const owned   = G.owned[a.id]?.count || 0;
      const placed  = G.slots.filter(s => s && s.id === a.id).length;
      const inc     = a.profit * (1 + (G.upgrades.income_booster||0)*0.1) *
                      ([1,2,5,10,20,50][G.upgrades.prestige||0]||1);
      return `
        <div class="shop-card ${canBuy?'':'locked'}" onclick="UI.openShopPopup(${a.id})">
          <div class="shop-emoji" style="text-shadow:0 0 18px ${tc.glow}">${a.emoji}</div>
          <div class="shop-info">
            <div class="shop-name">${a.name}
              <span class="tier-badge" style="color:${tc.color}">${tc.label}</span>
            </div>
            <div class="shop-stats">
              <span class="profit-tag">+${fmtN(inc)}/s</span>
              ${owned ? `<span class="owned-tag">×${owned}</span>` : ''}
            </div>
          </div>
          <div class="shop-right">
            <div class="shop-price ${canBuy?'':'unafford'}">🪙 ${fmtN(a.price)}</div>
            <button class="buy-btn ${canBuy?'':'cant'}"
                    onclick="event.stopPropagation();buyAnimal(${a.id},event)">
              ${canBuy ? 'Buy' : '🔒'}
            </button>
          </div>
        </div>`;
    }).join('');
  },

  setShopFilter(f, btnEl) {
    this.shopFilter = f;
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    this.renderShop();
  },

  // ── COLLECTION ───────────────────────────────────────
  renderCollection() {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    const ownedIds = Object.keys(G.owned).map(Number).filter(id => G.owned[id].count > 0);

    if (!ownedIds.length) {
      grid.innerHTML = '<div class="empty-state"><span>🐾</span><p>No animals yet.<br>Visit the Shop!</p></div>';
      return;
    }

    grid.innerHTML = ownedIds.map(id => {
      const def   = ANIMALS.find(a => a.id === id);
      const owned = G.owned[id];
      const tc    = TIER_CONFIG[def.tier];
      const placed = G.slots.filter(s => s?.id === id).length;
      return `
        <div class="col-card" style="--tc:${tc.color};--tg:${tc.glow}"
             onclick="UI.openCollectionAnimal(${id})">
          <div class="col-emoji">${def.emoji}</div>
          <div class="col-name">${def.name}</div>
          <div class="col-tier" style="color:${tc.color}">${tc.label}</div>
          <div class="col-stats">
            <span>×${owned.count}</span>
            <span>Lv${owned.maxLevel}</span>
            ${placed ? `<span style="color:var(--grn)">📍${placed}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  },

  // ── UPGRADES ─────────────────────────────────────────
  renderUpgrades() {
    const list = document.getElementById('upgrade-list');
    if (!list) return;

    list.innerHTML = GLOBAL_UPGRADES.map(upg => {
      const curLvl  = G.upgrades[upg.id] || 0;
      const isMax   = curLvl >= upg.maxLevel;
      const cost    = isMax ? 0 : calcGlobalUpgradeCost(upg.id, curLvl);
      const canBuy  = !isMax && G.coins >= cost;
      const effect  = upg.effectLabel(curLvl);
      const nextEff = isMax ? 'MAX' : upg.effectLabel(curLvl + 1);

      const dots = Array.from({length: upg.maxLevel}, (_,i) =>
        `<div class="lvl-dot ${i < curLvl ? 'done' : i === curLvl ? 'cur' : ''}"></div>`
      ).join('');

      return `
        <div class="upg-card">
          <div class="upg-icon">${upg.emoji}</div>
          <div class="upg-info">
            <div class="upg-name">${upg.name}
              <span class="upg-lvl-tag">Lv${curLvl}/${upg.maxLevel}</span>
            </div>
            <div class="upg-desc">${upg.desc}</div>
            <div class="upg-effect">${effect} ${!isMax?`→ ${nextEff}`:''}</div>
            <div class="upg-dots">${dots}</div>
          </div>
          <button class="upg-btn ${isMax?'max':canBuy?'':'cant'}"
                  onclick="buyGlobalUpgrade('${upg.id}',event)"
                  ${isMax?'disabled':''}>
            ${isMax ? '✅ MAX' : `🪙 ${fmtN(cost)}`}
          </button>
        </div>`;
    }).join('');
  },

  // ── DAILY ────────────────────────────────────────────
  renderDaily() {
    const now       = Date.now();
    const msDay     = 86400000;
    const canClaim  = !G.lastDailyClaim || (now - G.lastDailyClaim) >= msDay;
    const reward    = getDailyReward(G.streak);
    const nextIn    = G.lastDailyClaim ? Math.max(0, msDay - (now - G.lastDailyClaim)) : 0;
    const h = Math.floor(nextIn / 3600000);
    const m = Math.floor((nextIn % 3600000) / 60000);

    setText('streak-count', G.streak);
    setText('daily-coins',  fmtN(reward.coins));
    setText('daily-tokens', reward.tokens + AIRDROP.dailyClaim);
    setText('daily-day',    reward.label);

    const btn = document.getElementById('daily-claim-btn');
    if (btn) {
      btn.disabled    = !canClaim;
      btn.textContent = canClaim ? `🎁 Claim Day ${(G.streak % 7) + 1}` : `⏰ ${h}h ${m}m`;
    }

    // Streak calendar
    const cal = document.getElementById('streak-calendar');
    if (cal) {
      cal.innerHTML = DAILY_REWARDS.map((r, i) => {
        const done    = i < (G.streak % 7);
        const today   = i === (G.streak % 7);
        return `
          <div class="streak-day ${done?'done':today&&canClaim?'today':''}">
            <span>${done ? '✓' : today && canClaim ? '🎁' : r.day}</span>
            <small>🪙${fmtN(r.coins)}</small>
          </div>`;
      }).join('');
    }
  },

  showDailyClaimAnimation(reward) {
    // Large celebration overlay
    const el = document.createElement('div');
    el.className = 'claim-overlay';
    el.innerHTML = `
      <div class="claim-box">
        <div class="claim-emoji">🎁</div>
        <div class="claim-title">Day ${G.streak} Reward!</div>
        <div class="claim-coins">+🪙 ${fmtN(reward.coins)}</div>
        <div class="claim-tokens">+${reward.tokens + AIRDROP.dailyClaim} ZOO_TOKEN</div>
        <div class="claim-boost">🔥 +50% income for 4 hours!</div>
      </div>`;
    document.body.appendChild(el);
    TG.hapticNotification('success');
    setTimeout(() => el.remove(), 3000);
  },

  // ── REFERRALS ────────────────────────────────────────
  async renderReferral() {
    const link = getReferralLink();
    setText('ref-link', link);
    setText('ref-count', G.referralCount || 0);
    setText('ref-earned', fmtN(G.referralEarned || 0));

    // Load from server
    if (G.userId) {
      try {
        const r = await fetch('/api/referral?userId=' + G.userId);
        const d = await r.json();
        if (d.ok) {
          setText('ref-count', d.referralCount || 0);
          const list = document.getElementById('ref-list');
          if (list) {
            list.innerHTML = d.referrals?.length
              ? d.referrals.map(ref => `
                  <div class="ref-item">
                    <div class="ref-avatar">👤</div>
                    <div class="ref-name">${ref.first_name || ref.username || 'Player'}</div>
                    <div class="ref-bonus">+🪙 1000</div>
                  </div>`).join('')
              : '<div class="empty-state"><p>No friends yet 👥</p></div>';
          }
        }
      } catch(e) {}
    }
  },

  // ── TOKENS ───────────────────────────────────────────
  renderTokens() {
    const income    = calcTotalIncome(G);
    const rate      = calcPassiveTokenRate(G);
    const nextToken = calcTokenReward(income, G);

    setText('token-balance',  fmtTokens(G.tokens));
    setText('token-total',    fmtTokens(G.totalTokensEarned));
    setText('token-rate',     `+${rate}/min`);
    setText('token-next',     nextToken);
    setText('token-passive',  fmtTokens(G.passiveTokens || 0));

    // Milestones progress
    const mlist = document.getElementById('milestone-list');
    if (mlist) {
      mlist.innerHTML = MILESTONES.map(m => {
        const key   = `${m.type}_${m.value}`;
        const done  = G.earnedMilestones.includes(key);
        return `
          <div class="milestone-item ${done?'done':''}">
            <div class="ms-icon">${done ? '✅' : '🔒'}</div>
            <div class="ms-info">
              <div class="ms-label">${m.label}</div>
              <div class="ms-reward">+${m.tokens} ZOO_TOKEN ${m.coins?`+🪙${fmtN(m.coins)}`:''}</div>
            </div>
          </div>`;
      }).join('');
    }
  },



  // ── LOOT ─────────────────────────────────────────────
  renderLoot() {
    const boxList = document.getElementById('loot-box-list');
    const inv = document.getElementById('generated-list');
    if (!boxList || !inv) return;

    boxList.innerHTML = LOOT_BOXES.map(box => {
      const can = G.coins >= box.price;
      return `
        <div class="shop-card ${can ? '' : 'locked'}">
          <div class="shop-emoji">${box.emoji}</div>
          <div class="shop-info">
            <div class="shop-name">${box.name}</div>
            <div class="shop-stats"><span class="profit-tag">Roll ${Math.round(box.statRoll.min*100)}-${Math.round(box.statRoll.max*100)}%</span></div>
          </div>
          <div class="shop-right">
            <div class="shop-price ${can?'':'unafford'}">🪙 ${fmtN(box.price)}</div>
            <button class="buy-btn ${can?'':'cant'}" onclick="openLootBox('${box.id}')">Open</button>
          </div>
        </div>`;
    }).join('');

    if (!G.generatedAnimals.length) {
      inv.innerHTML = '<div class="empty-state"><p>No generated animals yet.</p></div>';
      return;
    }

    inv.innerHTML = G.generatedAnimals.map(a => `
      <div class="upg-card">
        <div class="upg-icon">${a.emoji}</div>
        <div class="upg-info">
          <div class="upg-name">${a.name} <span class="upg-lvl-tag">${a.tier}</span></div>
          <div class="upg-desc">Income: +${fmtN(generatedIncome(a))}/s · Stats ${Math.round(a.statMult*100)}%</div>
          <div class="upg-effect">Market value: 🪙 ${fmtN(a.marketValue)}</div>
        </div>
        <button class="upg-btn" onclick="listGeneratedAnimal(${a.uid}, ${a.marketValue})">List</button>
      </div>
    `).join('');
  },

  // ── MARKETPLACE ─────────────────────────────────────
  renderMarketplace() {
    const list = document.getElementById('market-list');
    if (!list) return;

    if (!G.marketListings.length) {
      list.innerHTML = '<div class="empty-state"><p>No active listings.</p></div>';
      return;
    }

    list.innerHTML = G.marketListings.map(l => {
      const canBuy = G.coins >= l.price;
      return `
        <div class="shop-card ${canBuy?'':'locked'}">
          <div class="shop-emoji">${l.animal.emoji}</div>
          <div class="shop-info">
            <div class="shop-name">${l.animal.name} <span class="tier-badge">${Math.round(l.animal.statMult*100)}%</span></div>
            <div class="shop-stats"><span class="profit-tag">+${fmtN(generatedIncome(l.animal))}/s</span></div>
          </div>
          <div class="shop-right">
            <div class="shop-price ${canBuy?'':'unafford'}">🪙 ${fmtN(l.price)}</div>
            <button class="buy-btn ${canBuy?'':'cant'}" onclick="buyMarketListing('${l.id}')">Buy</button>
          </div>
        </div>`;
    }).join('');
  },

  // ── OFFLINE BANNER ───────────────────────────────────
  showOfflineBanner(earned, tokenEarned, secsAway) {
    const el = document.getElementById('offline-banner');
    if (!el) return;
    const h = Math.floor(secsAway / 3600);
    const m = Math.floor((secsAway % 3600) / 60);
    el.innerHTML = `
      <span class="ob-icon">😴</span>
      <div class="ob-text">
        <b>Offline ${h}h ${m}m earnings</b>
        <span>+🪙 ${fmtN(earned)} &nbsp; +${tokenEarned} ZOO_TOKEN</span>
      </div>
      <button onclick="this.parentElement.style.display='none'">✕</button>`;
    el.style.display = 'flex';
    setTimeout(() => el.style.display = 'none', 8000);
  },

  // ── MILESTONE TOAST ──────────────────────────────────
  showMilestone(m) {
    const el = document.createElement('div');
    el.className = 'milestone-popup';
    el.innerHTML = `
      <div>🏆 ${m.label}</div>
      <div>+${m.tokens} ZOO_TOKEN ${m.coins ? `+🪙${fmtN(m.coins)}`:''}</div>`;
    document.body.appendChild(el);
    TG.hapticNotification('success');
    setTimeout(() => el.classList.add('show'), 50);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3500);
  },

  // ── ANIMAL POPUP (from map slot) ─────────────────────
  openAnimalPopup(slotIdx) {
    const slot = G.slots[slotIdx];
    if (!slot) return;
    const def    = ANIMALS.find(a => a.id === slot.id);
    const tc     = TIER_CONFIG[def.tier];
    const lvl    = slot.level || 1;
    const income = calcAnimalIncome(slot, lvl, G);
    const upgCost= calcUpgradeCost(def, lvl);
    const canUpg = G.coins >= upgCost && lvl < 50;

    this._openPopup({
      emoji:   def.emoji,
      title:   `${def.name} · Lv${lvl}`,
      tier:    def.tier,
      tc,
      stats: [
        {label:'Income/s', value:'+'+fmtN(income), color:'var(--grn)'},
        {label:'Level',    value:`${lvl} / 50`},
        {label:'Tier',     value:tc.label, color:tc.color},
        {label:'Base profit', value:fmtN(def.profit)},
      ],
      btns: [
        canUpg
          ? {label:`⬆️ Upgrade · 🪙${fmtN(upgCost)}`, cls:'btn-blue',   fn:()=>{upgradeAnimal(slotIdx);this.closePopup();}}
          : {label: lvl>=50 ? '✅ Max Level!' : `Need 🪙${fmtN(upgCost)}`, cls:'btn-gray', fn:null},
        {label:'📤 Remove from zoo', cls:'btn-red', fn:()=>{removeFromSlot(slotIdx);this.closePopup();}},
      ],
    });
    TG.showBack();
  },

  // ── SHOP POPUP ───────────────────────────────────────
  openShopPopup(animalId) {
    const def   = ANIMALS.find(a => a.id === animalId);
    const tc    = TIER_CONFIG[def.tier];
    const canBuy= G.coins >= def.price;
    const cap   = getZooCapacity(G);
    const full  = G.slots.filter(Boolean).length >= cap;
    const boosterMult = 1 + (G.upgrades.income_booster||0)*0.1;
    const prestigeMult= [1,2,5,10,20,50][G.upgrades.prestige||0]||1;
    const eff   = def.profit * boosterMult * prestigeMult;

    this._openPopup({
      emoji: def.emoji,
      title: def.name,
      tier:  def.tier,
      tc,
      stats: [
        {label:'Price',      value:'🪙 '+fmtN(def.price), color:'var(--gold)'},
        {label:'Income/s',   value:'+'+fmtN(eff),         color:'var(--grn)'},
        {label:'Tier',       value:tc.stars + ' ' + tc.label, color:tc.color},
        {label:'Token drop', value:'+'+AIRDROP.animalPurchase(def.tier)+' ZOO', color:'#A259FF'},
      ],
      btns: [
        full
          ? {label:'🏗️ Zoo full! Upgrade capacity', cls:'btn-gray', fn:null}
          : canBuy
            ? {label:`🛒 Buy · 🪙 ${fmtN(def.price)}`, cls:'btn-green', fn:(e)=>{buyAnimal(animalId,e);this.closePopup();}}
            : {label:`Need 🪙 ${fmtN(def.price - G.coins)} more`, cls:'btn-gray', fn:null},
      ],
    });
    TG.showBack();
  },

  openCollectionAnimal(animalId) {
    const def   = ANIMALS.find(a => a.id === animalId);
    const owned = G.owned[animalId] || {};
    const placed= G.slots.filter(s => s?.id === animalId);
    const tc    = TIER_CONFIG[def.tier];

    this._openPopup({
      emoji: def.emoji,
      title: def.name,
      tier:  def.tier,
      tc,
      stats: [
        {label:'Owned',      value:'×' + (owned.count||0)},
        {label:'Max Level',  value:'Lv' + (owned.maxLevel||1)},
        {label:'Placed',     value: placed.length + ' in zoo'},
        {label:'Base profit',value: fmtN(def.profit) + '/s'},
      ],
      btns: [
        {label:'🛒 Go to Shop', cls:'btn-blue', fn:()=>{this.closePopup();this.switchTab('shop');}},
      ],
    });
  },

  // ── GENERIC POPUP ────────────────────────────────────
  _openPopup({emoji, title, tier, tc, stats, btns}) {
    this.currentPopup = true;
    const overlay = document.getElementById('popup-overlay');
    if (!overlay) return;

    const statsHtml = stats.map(s => `
      <div class="popup-stat">
        <div class="ps-val" ${s.color?`style="color:${s.color}"`:''} >${s.value}</div>
        <div class="ps-lbl">${s.label}</div>
      </div>`).join('');

    const btnsHtml = btns.map(b => `
      <button class="popup-btn ${b.cls}" ${!b.fn?'disabled':''} onclick="UI._popupBtnClick(${btns.indexOf(b)})">
        ${b.label}
      </button>`).join('');

    overlay.innerHTML = `
      <div class="popup-sheet" onclick="event.stopPropagation()">
        <div class="popup-handle"></div>
        <button class="popup-close" onclick="UI.closePopup()">✕</button>
        <div class="popup-emoji" style="text-shadow:0 0 30px ${tc.glow}">${emoji}</div>
        <div class="popup-title">${title}</div>
        <div class="popup-tier" style="color:${tc.color};background:${tc.bg};border-color:${tc.color}">
          ${tc.stars} ${tc.label.toUpperCase()}
        </div>
        <div class="popup-stats">${statsHtml}</div>
        <div class="popup-btns">${btnsHtml}</div>
      </div>`;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('open'));
    this._currentBtns = btns;
    TG.haptic('medium');
  },

  _popupBtnClick(idx) {
    const btn = this._currentBtns?.[idx];
    if (btn?.fn) btn.fn(event);
  },

  closePopup() {
    const overlay = document.getElementById('popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    setTimeout(() => { overlay.style.display = 'none'; overlay.innerHTML = ''; }, 350);
    this.currentPopup = null;
    this._currentBtns = null;
    TG.hideBack();
  },

  // ── ANIMATIONS ───────────────────────────────────────
  spawnCoinFloat(event) {
    const el = document.createElement('div');
    el.className = 'coin-float';
    el.textContent = '🪙';
    el.style.cssText = `left:${event?.clientX||window.innerWidth/2}px;top:${event?.clientY||100}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },

  spawnLevelFloat(event, level) {
    const el = document.createElement('div');
    el.className = 'level-float';
    el.textContent = `▲ Lv${level}`;
    el.style.cssText = `left:${event?.clientX||window.innerWidth/2}px;top:${event?.clientY||100}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  },
};

// ── HELPERS ───────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setProgress(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, pct) + '%';
}