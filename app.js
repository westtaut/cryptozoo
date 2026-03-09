import { initTelegram } from './telegram.js';
import { loadState, saveState } from './storage.js';
import { loadAnimalDatabase, generateAnimalFromRarity } from './animals.js';
import { spinCase } from './cases.js';
import { ECON } from './economy.js';
import { MarketSystem } from './market.js';
import { AuctionSystem } from './auction.js';
import { fight } from './pvp.js';
import { buildLeaderboard } from './leaderboard.js';
import { applyTheme, getSavedTheme } from './themes.js';
import * as UI from './ui.js';

const tgUser = initTelegram();
const db = await loadAnimalDatabase();

tgUserEl.textContent = `@${tgUser.name} • id ${tgUser.id}`;
applyTheme(getSavedTheme());
const seedPlayers = { [tgUser.id]: { id: tgUser.id, name: tgUser.name, coins: 5400, zooToken: 120, energy: 70, playerLevel: 2, referrals: 2, dailyStreak: 0, lastDaily: 0, zooTokenEarned: 0, rareCollected: 0, pvpVictories: 0 }, bot1: { id: 'bot1', name: 'ArcticWhale', coins: 9999, zooToken: 800, energy: 100, zooTokenEarned: 12000, rareCollected: 84, pvpVictories: 61 }, bot2: { id: 'bot2', name: 'NeonTiger', coins: 8999, zooToken: 620, energy: 100, zooTokenEarned: 10100, rareCollected: 68, pvpVictories: 57 } };
const state = loadState() || { players: seedPlayers, animals: [], zooSlots: Array(20).fill(null), marketListings: [], salesHistory: [], treasury: 0 };
const me = state.players[tgUser.id] || (state.players[tgUser.id] = seedPlayers[tgUser.id]);
for (let i = 0; i < 15; i++) if (!state.animals.some((a) => a.ownerId === me.id)) { const a = generateAnimalFromRarity(i < 10 ? 'common' : 'rare', db); a.ownerId = me.id; state.animals.push(a); }
const market = new MarketSystem(state); const auctions = new AuctionSystem(state);
UI.bindTabs(); UI.renderCases(openCase); UI.renderThemes((name) => { applyTheme(name); rerender(); });
claimDailyBtn.onclick = claimDaily; refreshMarket.onclick = () => { tickMarket(); rerender(); }; fightBtn.onclick = startFight;
fRarity.innerHTML = '<option value="all">All</option><option>common</option><option>rare</option><option>epic</option><option>legendary</option><option>mythic</option><option>ultra</option>';
fSort.innerHTML = '<option value="new">Newest</option><option value="priceAsc">Price ↑</option><option value="priceDesc">Price ↓</option>';
setInterval(() => { const inc = ECON.zooIncome(state.zooSlots.filter(Boolean), 1 + me.playerLevel * 0.03, 1) / 3600; me.coins += inc; me.zooToken += inc * 0.09; tickMarket(); saveState(state); rerender(); }, 1000);

function openCase(key) {
  const price = ECON.casePrice(180, me.playerLevel);
  if (me.coins < price) return alert('Not enough Coins');
  me.coins -= price;
  const roll = Array.from({ length: 16 }, () => spinCase(key, db));
  const won = roll.at(-1);
  UI.animateRoulette(roll, won.rarity === 'ultra');
  setTimeout(() => { won.ownerId = me.id; state.animals.push(won); alert(`${won.rarity === 'ultra' ? '🌈 ULTRA DROP! ' : ''}${won.emoji} ${won.name} [${won.rarity}]`); rerender(); }, 1400);
}
function claimDaily() { const now = Date.now(); if (now - me.lastDaily < 86400000) return; me.dailyStreak += 1; me.lastDaily = now; const reward = ECON.dailyReward(220, me.dailyStreak); me.coins += reward; me.energy += 12; rerender(); }
function startFight() { if (me.energy < 10) return; const selected = [...document.querySelectorAll('#pvpRoster input:checked')].slice(0, 3).map((i) => state.animals.find((a) => a.id === i.value)); if (selected.length < 3) return; const enemy = Array.from({ length: 3 }, () => generateAnimalFromRarity(['common', 'rare', 'epic'][Math.floor(Math.random() * 3)], db)); const res = fight(selected, enemy); me.energy -= 10; me.coins += res.rewards.coins; me.zooToken += res.rewards.token; battleLog.innerHTML = `${res.win ? '🏆 Victory' : '💥 Defeat'}<br>${res.scoreA} vs ${res.scoreB}`; rerender(); }
function tickMarket() { market.cleanupExpired(); auctions.settle(); }
function rerender() {
  UI.renderHUD(state, me);
  UI.renderZoo(state, me, (slotIdx) => { const pick = state.animals.find((a) => a.ownerId === me.id && !a.locked && !state.zooSlots.includes(a)); if (pick) { state.zooSlots[slotIdx] = pick; rerender(); } });
  UI.renderMarket(filteredMarket(), me, { onCreate: () => { const id = sellAnimal.value; const mode = sellMode.value; const price = +sellPrice.value; const animal = state.animals.find((a) => a.id === id); if (!animal) return; market.createListing(animal, me.id, mode, price, 24); rerender(); }, onAction: (id) => { const l = state.marketListings.find((x) => x.id === id); if (!l) return; if (l.mode === 'buy') market.buy(id, me.id); else auctions.placeBid(id, me.id, Math.ceil((l.current_price || l.starting_price) * 1.04)); rerender(); } });
  UI.renderAuctions(state); UI.renderPriceChart(state.salesHistory); UI.renderPvp(state, me); UI.renderLeaders(buildLeaderboard(state.players));
  animalsList.innerHTML = state.animals.filter((a) => a.ownerId === me.id).slice(0, 120).map((a) => `<div class='animal-card rarity-${a.rarity}'>${a.emoji} ${a.name}<br>${a.rarity}</div>`).join('');
  dailyPanel.innerHTML = `<div class='card glass'>Daily streak: ${me.dailyStreak}<br>Next reward scales with streak.</div>`;
  saveState(state);
}
function filteredMarket() { const rarity = fRarity.value || 'all'; const sort = fSort.value || 'new'; let listings = state.marketListings.filter((l) => l.active && l.seller_id !== me.id); if (rarity !== 'all') listings = listings.filter((l) => l.rarity === rarity); if (sort === 'priceAsc') listings.sort((a, b) => a.current_price - b.current_price); else if (sort === 'priceDesc') listings.sort((a, b) => b.current_price - a.current_price); else listings.sort((a, b) => b.created_at - a.created_at); return { ...state, marketListings: listings }; }
fRarity.onchange = rerender; fSort.onchange = rerender; rerender();
