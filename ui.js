import { CASES } from './cases.js';
import { THEMES } from './themes.js';

export function bindTabs() {
  document.querySelectorAll('.tab').forEach((btn) => btn.onclick = () => {
    document.querySelectorAll('.tab,.panel').forEach((n) => n.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
}

export function renderHUD(_, me) {
  coins.textContent = Math.floor(me.coins);
  token.textContent = Math.floor(me.zooToken);
  energy.textContent = Math.floor(me.energy);
}

export function renderZoo(state, me, onPlace) {
  zooGrid.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const a = state.zooSlots[i];
    const cell = document.createElement('button');
    cell.className = 'zoo-cell glass';
    cell.innerHTML = a ? `<span class="emoji">${a.emoji}</span><small>${a.name.slice(0, 12)}</small>` : '<small>+ Empty</small>';
    cell.onclick = () => onPlace(i);
    zooGrid.appendChild(cell);
  }
  inventory.innerHTML = state.animals.filter((a) => a.ownerId === me.id && !a.locked).slice(0, 80).map(card).join('');
}

export function renderCases(onOpen) {
  caseList.innerHTML = Object.entries(CASES).map(([k, c]) => `<div class="card glass"><b>${c.name}</b><p>Шанс: CS-style рулетка</p><button class="primary" data-case="${k}">Open</button></div>`).join('');
  caseList.querySelectorAll('button').forEach((b) => b.onclick = () => onOpen(b.dataset.case));
}

export function animateRoulette(items, ultra = false) {
  roulette.classList.toggle('ultra', ultra);
  roulette.innerHTML = items.map((i) => `<div class="chip rarity-${i.rarity}">${i.emoji} ${i.name}</div>`).join('');
}

export function renderMarket(state, me, handlers) {
  marketList.innerHTML = state.marketListings.map((l) => `<div class="animal-card rarity-${l.rarity}"><b>${l.stats.emoji} ${l.stats.name}</b><br>${l.mode}<br>💰${Math.floor(l.current_price || l.price)}<br><button class="primary" data-id="${l.id}">${l.mode === 'buy' ? 'Buy' : 'Bid'}</button></div>`).join('');
  document.querySelectorAll('#marketList button').forEach((b) => b.onclick = () => handlers.onAction(b.dataset.id));
  const options = state.animals.filter((a) => a.ownerId === me.id && !a.locked).slice(0, 30).map((a) => `<option value="${a.id}">${a.emoji} ${a.name}</option>`).join('');
  sellForm.innerHTML = `<select id="sellAnimal">${options}</select><select id="sellMode"><option value="buy">Buy now</option><option value="auction">Auction</option></select><input id="sellPrice" type="number" value="300"/><button class="primary" id="sellBtn">List</button>`;
  sellBtn.onclick = handlers.onCreate;
}

export function renderAuctions(state) {
  auctionList.innerHTML = state.marketListings.filter((l) => l.mode === 'auction' && l.active).map((l) => `<div class="card glass"><b>${l.stats.emoji} ${l.stats.name}</b><br>Start: ${l.starting_price} • Current: ${Math.floor(l.current_price)}<br>Bids: ${l.bid_history.length} • End: ${new Date(l.end_time).toLocaleTimeString()}</div>`).join('');
}

export function renderPriceChart(salesHistory) {
  const now = Date.now();
  const windows = { '24H': 86400000, '7D': 7 * 86400000, '30D': 30 * 86400000 };
  priceCharts.innerHTML = Object.entries(windows).map(([label, ms]) => {
    const points = salesHistory.filter((s) => s.at > now - ms).slice(0, 30);
    const max = Math.max(1, ...points.map((p) => p.price));
    const d = points.map((p, i) => `${(i / 29) * 100},${100 - (p.price / max) * 100}`).join(' ');
    return `<div class="card glass"><b>${label}</b><svg viewBox="0 0 100 100"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${d}"/></svg></div>`;
  }).join('');
}

export function renderPvp(state, me) { pvpRoster.innerHTML = state.animals.filter((a) => a.ownerId === me.id && !a.locked).slice(0, 9).map((a) => `<label class="animal-card rarity-${a.rarity}"><input type="checkbox" value="${a.id}"/>${a.emoji} ${a.name}</label>`).join(''); }
export function renderLeaders(lines) { leadersList.innerHTML = lines.map((l) => `<div>${l}</div>`).join(''); }
export function renderThemes(onTheme) {
  themes.innerHTML = Object.keys(THEMES).map((t) => `<button class="card glass" data-theme="${t}">${t}</button>`).join('');
  document.querySelectorAll('[data-theme]').forEach((b) => b.onclick = () => onTheme(b.dataset.theme));
}
const card = (a) => `<div class="animal-card rarity-${a.rarity}">${a.emoji}<b>${a.name}</b><br>${a.rarity} • Lv.${a.level}<br>💰${Math.floor(a.income)} ⚔️${a.power}</div>`;
