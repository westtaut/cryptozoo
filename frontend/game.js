import { ANIMALS } from '../data/animals.js';
import { CASES, generateAnimalDrop } from '../systems/cases.js';
import { calcIncome, calcAnimalPrice, upgradeCost } from '../systems/economy.js';
import { createListing, createAuction, placeBid } from '../systems/market.js';
import { runBattle } from '../systems/pvp.js';
import { rankPlayers } from '../systems/leaderboard.js';
import { canMintNFT, mintAnimalNFT } from '../backend/blockchain.js';

const state = {
  coins: 500,
  zooToken: 25,
  energy: 20,
  animals: [],
  zooSlots: Array(50).fill(null),
  market: [],
  auctions: [],
  pvpWins: 0,
  pvpPoints: 0,
  earnedZooToken: 0,
  referrals: 0,
  dailyDay: 1,
  dailyClaimAt: 0,
  leaderboardSeed: [
    { name: 'AlphaWhale', earnedZooToken: 9300, pvpWins: 88, rareAnimals: 27 },
    { name: 'PandaLord', earnedZooToken: 7100, pvpWins: 51, rareAnimals: 35 },
    { name: 'CyberMole', earnedZooToken: 6000, pvpWins: 67, rareAnimals: 20 },
  ],
};

const tabs = ['map', 'cases', 'animals', 'market', 'auction', 'pvp', 'leaderboard', 'daily', 'refer'];
let activeTab = 'map';

initTelegram();
mountTabs();
render();
setInterval(gameTick, 1000);

function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
}

function mountTabs() {
  const tabsEl = document.getElementById('tabs');
  tabsEl.innerHTML = tabs.map((tab) => `<button data-tab="${tab}">${tab.toUpperCase()}</button>`).join('');
  tabsEl.onclick = (event) => {
    const target = event.target.closest('button[data-tab]');
    if (!target) return;
    activeTab = target.dataset.tab;
    render();
  };
}

function gameTick() {
  const perSec = totalIncome();
  state.zooToken += perSec;
  state.earnedZooToken += perSec;
  state.energy = Math.min(50, state.energy + 0.2);
  renderHeader();
}

function totalIncome() {
  return Math.floor(state.zooSlots.filter(Boolean).reduce((sum, animal) => sum + calcIncome(animal), 0));
}

function renderHeader() {
  document.getElementById('coins').textContent = fmt(state.coins);
  document.getElementById('token').textContent = fmt(state.zooToken);
  document.getElementById('energy').textContent = Math.floor(state.energy);
  document.getElementById('income').textContent = fmt(totalIncome());
  document.querySelectorAll('#tabs button').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === activeTab);
  });
}

function render() {
  renderHeader();
  const view = document.getElementById('view');
  const builders = {
    map: renderMap,
    cases: renderCases,
    animals: renderAnimals,
    market: renderMarket,
    auction: renderAuction,
    pvp: renderPvp,
    leaderboard: renderLeaderboard,
    daily: renderDaily,
    refer: renderRefer,
  };
  view.innerHTML = builders[activeTab]();
  wireActions();
}

function renderMap() {
  const slots = state.zooSlots.map((animal, index) => {
    if (!animal) return `<div class="slot">Клетка ${index + 1}</div>`;
    return `<div class="slot">${animal.emoji}<br>${animal.name}<br>Lv.${animal.level}</div>`;
  }).join('');

  return `<section class="card"><h3>🗺️ Карта зоопарка (50 клеток)</h3><div class="grid">${slots}</div></section>`;
}

function renderCases() {
  const list = Object.entries(CASES).map(([id, c]) => `
    <div class="card row">
      <div>
        <b>${c.name}</b>
        <div class="small">Цена: ${fmt(c.price)} coins</div>
      </div>
      <button class="buy" data-open-case="${id}">Открыть</button>
    </div>
  `).join('');
  return `<section class="list">${list}</section>`;
}

function renderAnimals() {
  const list = state.animals.slice(0, 120).map((animal) => `
    <div class="card">
      <div class="row"><b>${animal.emoji} ${animal.name}</b><span>${animal.rarity}</span></div>
      <div class="small">Lv ${animal.level} | Charm ${animal.charm} | Speed ${animal.speed} | Power ${animal.power} | Mut: ${animal.mutation}</div>
      <div class="row">
        <span>Доход: ${fmt(Math.floor(calcIncome(animal)))}/s</span>
        <div>
          <button data-upgrade="${animal.uid}">Upgrade</button>
          <button class="warn" data-list="${animal.uid}">Sell</button>
          ${canMintNFT(animal) ? `<button data-mint="${animal.uid}">NFT</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
  return `<section class="card"><h3>🐾 Коллекция (${state.animals.length})</h3>${list || '<div class="small">Откройте первый кейс.</div>'}</section>`;
}

function renderMarket() {
  const items = state.market.map((listing) => `
    <div class="card row">
      <div><b>${listing.animal.emoji} ${listing.animal.name}</b><div class="small">${listing.animal.rarity}</div></div>
      <div>
        <div>${fmt(listing.price)} coins</div>
        <button class="buy" data-buy="${listing.id}">Купить</button>
      </div>
    </div>
  `).join('');
  return `<section class="card"><h3>🏪 P2P Market</h3>${items || 'Пока пусто'}</section>`;
}

function renderAuction() {
  const items = state.auctions.map((auction) => `
    <div class="card">
      <div class="row"><b>${auction.animal.emoji} ${auction.animal.name}</b><span>${fmt(auction.highest_bid)} coins</span></div>
      <div class="small">Ставок: ${auction.bid_history.length} | Осталось: ${auction.time_left}s</div>
      <button data-bid="${auction.id}">Сделать ставку +100</button>
    </div>
  `).join('');
  return `<section class="card"><h3>🔨 Аукцион</h3><button data-create-auction>Выставить первого зверя</button>${items}</section>`;
}

function renderPvp() {
  return `<section class="card"><h3>⚔️ PvP Arena</h3>
      <p class="small">Выберите 3 лучших животных автоматически, энергия за бой: 5.</p>
      <button data-pvp>Начать бой</button>
      <div class="small">Победы: ${state.pvpWins} | PvP points: ${state.pvpPoints}</div>
    </section>`;
}

function renderLeaderboard() {
  const playerRow = {
    name: 'You',
    earnedZooToken: state.earnedZooToken,
    pvpWins: state.pvpWins,
    rareAnimals: state.animals.filter((a) => ['Legendary', 'Mythic'].includes(a.rarity)).length,
  };
  const boards = rankPlayers([...state.leaderboardSeed, playerRow]);

  return `<section class="card">
    <h3>🏆 Leaderboard</h3>
    <div class="small">Top ZooToken: ${boards.byIncome.map((p) => `${p.name}(${Math.floor(p.earnedZooToken)})`).join(', ')}</div>
    <div class="small">Top PvP: ${boards.byPvp.map((p) => `${p.name}(${p.pvpWins})`).join(', ')}</div>
    <div class="small">Top Rare: ${boards.byRare.map((p) => `${p.name}(${p.rareAnimals})`).join(', ')}</div>
  </section>`;
}

function renderDaily() {
  const rewards = ['Day1 100 coins', 'Day2 300 coins', 'Day3 Rare Case', 'Day7 Legendary Case'];
  return `<section class="card"><h3>🎁 Daily Rewards</h3>
    <div>Текущий день: ${state.dailyDay}</div>
    <div class="small">${rewards.join(' • ')}</div>
    <button data-daily>Claim daily</button>
  </section>`;
}

function renderRefer() {
  const refLink = `https://t.me/zoochain_bot/app?startapp=player_demo`;
  return `<section class="card"><h3>👥 Referral</h3>
    <div class="small">Ссылка: ${refLink}</div>
    <button data-refer>Симулировать приглашение</button>
    <div class="small">Рефералов: ${state.referrals}</div>
  </section>`;
}

function wireActions() {
  document.querySelectorAll('[data-open-case]').forEach((button) => {
    button.onclick = () => {
      const id = button.dataset.openCase;
      const c = CASES[id];
      if (state.coins < c.price) return alert('Не хватает Coins');
      state.coins -= c.price;
      const animal = generateAnimalDrop(id);
      if (Math.random() <= 0.0005) {
        animal.name = 'Golden Dragon';
        animal.emoji = '🐉';
        animal.rarity = 'Mythic';
      }
      state.animals.push(animal);
      const slot = state.zooSlots.findIndex((s) => s === null);
      if (slot >= 0) state.zooSlots[slot] = animal;
      render();
    };
  });

  document.querySelectorAll('[data-upgrade]').forEach((button) => {
    button.onclick = () => {
      const animal = state.animals.find((item) => item.uid === button.dataset.upgrade);
      const cost = upgradeCost(calcAnimalPrice(animal), animal.level);
      if (state.coins < cost) return alert('Недостаточно Coins');
      state.coins -= cost;
      animal.level += 1;
      render();
    };
  });

  document.querySelectorAll('[data-list]').forEach((button) => {
    button.onclick = () => {
      const idx = state.animals.findIndex((item) => item.uid === button.dataset.list);
      if (idx === -1) return;
      const [animal] = state.animals.splice(idx, 1);
      const askPrice = calcAnimalPrice(animal);
      state.market.push(createListing('you', animal, askPrice));
      const slot = state.zooSlots.findIndex((a) => a?.uid === animal.uid);
      if (slot >= 0) state.zooSlots[slot] = null;
      render();
    };
  });

  document.querySelectorAll('[data-buy]').forEach((button) => {
    button.onclick = () => {
      const idx = state.market.findIndex((item) => item.id === button.dataset.buy);
      const item = state.market[idx];
      if (!item || state.coins < item.price) return;
      state.coins -= item.price;
      state.animals.push(item.animal);
      state.market.splice(idx, 1);
      const slot = state.zooSlots.findIndex((s) => s === null);
      if (slot >= 0) state.zooSlots[slot] = item.animal;
      render();
    };
  });

  document.querySelector('[data-create-auction]')?.addEventListener('click', () => {
    const animal = state.animals[0];
    if (!animal) return;
    state.auctions.push(createAuction('you', animal, calcAnimalPrice(animal)));
    render();
  });

  document.querySelectorAll('[data-bid]').forEach((button) => {
    button.onclick = () => {
      const auction = state.auctions.find((a) => a.id === button.dataset.bid);
      if (!auction) return;
      const amount = auction.highest_bid + 100;
      if (state.coins < amount) return;
      placeBid(auction, 'you', amount);
      render();
    };
  });

  document.querySelector('[data-pvp]')?.addEventListener('click', () => {
    if (state.energy < 5) return alert('Нужна энергия');
    const team = [...state.animals].sort((a, b) => b.power - a.power).slice(0, 3);
    if (team.length < 3) return alert('Нужно 3 животных');
    const enemy = state.leaderboardSeed[0];
    const enemyTeam = team.map((a) => ({ ...a, power: a.power * 0.9 }));
    const result = runBattle(team, enemyTeam);
    state.energy -= 5;
    state.coins += result.rewards.coins;
    state.zooToken += result.rewards.zooToken;
    state.pvpPoints += result.rewards.pvpPoints;
    if (result.winner === 'A') state.pvpWins += 1;
    alert(`Бой против ${enemy.name}: ${result.scoreA} vs ${result.scoreB}`);
    render();
  });

  document.querySelector('[data-daily]')?.addEventListener('click', claimDaily);
  document.querySelector('[data-refer]')?.addEventListener('click', () => {
    state.referrals += 1;
    state.coins += 500;
    state.zooToken += totalIncome() * 0.05;
    render();
  });

  document.querySelectorAll('[data-mint]').forEach((button) => {
    button.onclick = () => {
      const animal = state.animals.find((item) => item.uid === button.dataset.mint);
      if (!animal || animal.nft) return;
      animal.nft = mintAnimalNFT(animal, '0xPLAYER');
      alert(`NFT minted: ${animal.nft.token_id}`);
      render();
    };
  });
}

function claimDaily() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  if (now - state.dailyClaimAt < dayMs) return alert('Уже получено сегодня');
  state.dailyClaimAt = now;

  if (state.dailyDay === 1) state.coins += 100;
  if (state.dailyDay === 2) state.coins += 300;
  if (state.dailyDay === 3) {
    state.animals.push(generateAnimalDrop('jungle'));
  }
  if (state.dailyDay === 7) {
    state.animals.push(generateAnimalDrop('legendary'));
  }

  state.dailyDay = state.dailyDay >= 7 ? 1 : state.dailyDay + 1;
  render();
}

function fmt(value) {
  return Math.floor(value).toLocaleString('en-US');
}
