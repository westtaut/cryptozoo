import { initTelegram } from './telegram.js';
import { applyTheme, getSavedTheme } from './themes.js';
import { loadState, saveState } from './storage.js';
import { generateAnimalFromRarity } from './animals.js';
import { ECON } from './economy.js';
import { spinCase } from './cases.js';
import { MarketSystem } from './market.js';
import { AuctionSystem } from './auction.js';
import { fight } from './pvp.js';
import { buildLeaderboard } from './leaderboard.js';
import * as UI from './ui.js';

const tgUser = initTelegram();
document.getElementById('tgUser').textContent = `@${tgUser.name} • id ${tgUser.id}`;
applyTheme(getSavedTheme());

const seedPlayers = {
  [tgUser.id]:{id:tgUser.id,name:tgUser.name,coins:2400,zooToken:120,energy:70,playerLevel:1,referrals:2,dailyStreak:0,lastDaily:0,zooTokenEarned:0,rareCollected:0,pvpVictories:0},
  bot1:{id:'bot1',name:'ArcticWhale',coins:9999,zooToken:800,energy:100,zooTokenEarned:12000,rareCollected:84,pvpVictories:61},
  bot2:{id:'bot2',name:'NeonTiger',coins:8999,zooToken:620,energy:100,zooTokenEarned:10100,rareCollected:68,pvpVictories:57}
};

const state = loadState() || { players:seedPlayers, animals:[], zooSlots:Array(20).fill(null), marketListings:[], salesHistory:[], treasury:0 };
const me = state.players[tgUser.id] || (state.players[tgUser.id]=seedPlayers[tgUser.id]);
for(let i=0;i<12;i++){ if(!state.animals.some(a=>a.ownerId===me.id)){ const a=generateAnimalFromRarity(i<8?'common':'rare'); a.ownerId=me.id; state.animals.push(a);} }

const market = new MarketSystem(state);
const auctions = new AuctionSystem(state);

UI.bindTabs();
UI.renderCases(openCase);
UI.renderThemes((name)=>{ applyTheme(name); rerender();});
document.getElementById('claimDaily').onclick=claimDaily;
document.getElementById('refreshMarket').onclick=()=>{tickMarket(); rerender();};
document.getElementById('fightBtn').onclick=startFight;
document.getElementById('fRarity').innerHTML='<option value="all">All rarities</option><option>common</option><option>rare</option><option>epic</option><option>legendary</option><option>mythic</option><option>ultra</option>';
document.getElementById('fSort').innerHTML='<option value="new">Newest</option><option value="priceAsc">Price ↑</option><option value="priceDesc">Price ↓</option>';

setInterval(()=>{
  const inc = ECON.zooIncome(state.zooSlots.filter(Boolean), 1+me.playerLevel*0.03)/3600;
  me.coins += inc; me.zooToken += inc*0.09; me.zooTokenEarned += inc*0.09;
  me.coins += me.referrals * 0.12;
  tickMarket();
  saveState(state); rerender();
}, 1000);

function openCase(key){
  const price = ECON.casePrice(180, me.playerLevel);
  if(me.coins < price) return alert('Not enough Coins');
  me.coins -= price;
  const roll = Array.from({length:14},()=>spinCase(key));
  UI.animateRoulette(roll);
  setTimeout(()=>{
    const won = roll.at(-1); won.ownerId=me.id; state.animals.push(won);
    if(['rare','epic','legendary','mythic','ultra'].includes(won.rarity)) me.rareCollected += 1;
    alert(`You got ${won.emoji} ${won.name} [${won.rarity}]`);
    rerender();
  },1900);
}

function claimDaily(){
  const now=Date.now(); if(now-me.lastDaily < 86400000) return alert('Already claimed today');
  me.dailyStreak +=1; me.lastDaily=now;
  const reward = ECON.dailyReward(220, me.dailyStreak);
  me.coins += reward; me.zooToken += Math.floor(reward*0.08); me.energy += 12;
  rerender();
}

function startFight(){
  if(me.energy<10) return alert('Need 10 energy');
  const selected = Array.from(document.querySelectorAll('#pvpRoster input:checked')).slice(0,3).map(i=>state.animals.find(a=>a.id===i.value));
  if(selected.length<3) return alert('Choose 3 animals');
  const enemy = Array.from({length:3},()=>generateAnimalFromRarity(['common','rare','epic'][Math.floor(Math.random()*3)]));
  const res = fight(selected, enemy); me.energy -= 10;
  me.coins += res.rewards.coins; me.zooToken += res.rewards.token; if(res.win) me.pvpVictories+=1;
  document.getElementById('battleLog').innerHTML = `${res.win?'🏆 Victory':'💥 Defeat'}<br>${res.scoreA} vs ${res.scoreB}<br>+${res.rewards.coins} Coins, +${res.rewards.token} ZooToken`;
  rerender();
}

function tickMarket(){
  market.cleanupExpired(); auctions.settle();
  if(Math.random()<0.18){
    const seller = Math.random()<0.5?'bot1':'bot2';
    const animal = generateAnimalFromRarity(['rare','epic','legendary'][Math.floor(Math.random()*3)]);
    animal.ownerId=seller; state.animals.push(animal);
    market.createListing(animal,seller,Math.random()<0.75?'buy':'auction',Math.floor(300+Math.random()*2600),24);
  }
}

function rerender(){
  UI.renderHUD(state, me);
  UI.renderZoo(state, me, (slotIdx)=>{
    const pick = state.animals.find(a=>a.ownerId===me.id && !a.locked && !state.zooSlots.includes(a));
    if(pick){ state.zooSlots[slotIdx]=pick; rerender(); }
  });
  UI.renderMarket(filteredMarket(), me, {
    onCreate:()=>{
      const id=document.getElementById('sellAnimal').value; const mode=document.getElementById('sellMode').value; const price=+document.getElementById('sellPrice').value;
      const animal = state.animals.find(a=>a.id===id); if(!animal) return;
      try{market.createListing(animal, me.id, mode, price, 24); rerender();}catch(e){alert(e.message);}
    },
    onAction:(id)=>{
      const l = state.marketListings.find(x=>x.id===id); if(!l) return;
      try{ if(l.mode==='buy') market.buy(id, me.id); else auctions.placeBid(id, me.id, (l.bids.at(-1)?.amount||l.price)+50); rerender(); }
      catch(e){alert(e.message);} }
  });
  UI.renderPvp(state, me);
  UI.renderLeaders(buildLeaderboard(state.players));
  saveState(state);
}

function filteredMarket(){
  const rarity = document.getElementById('fRarity').value || 'all';
  const sort = document.getElementById('fSort').value || 'new';
  let listings = state.marketListings.filter(l=>l.active && l.seller_id!==me.id);
  if(rarity!=='all') listings = listings.filter(l=>l.rarity===rarity);
  if(sort==='priceAsc') listings.sort((a,b)=>a.price-b.price);
  else if(sort==='priceDesc') listings.sort((a,b)=>b.price-a.price);
  else listings.sort((a,b)=>b.created_at-a.created_at);
  return {...state, marketListings:listings};
}

document.getElementById('fRarity').onchange=rerender;
document.getElementById('fSort').onchange=rerender;
rerender();
