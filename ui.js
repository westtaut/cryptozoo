import { CASES } from './cases.js';
import { THEMES } from './themes.js';

export function bindTabs(){
  document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.tab,.panel').forEach(n=>n.classList.remove('active'));
    btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.add('active');
  });
}

export function renderHUD(state, me){
  document.getElementById('coins').textContent=Math.floor(me.coins);
  document.getElementById('token').textContent=Math.floor(me.zooToken);
  document.getElementById('energy').textContent=Math.floor(me.energy);
}

export function renderZoo(state, me, onPlace){
  const grid = document.getElementById('zooGrid'); grid.innerHTML='';
  for(let i=0;i<20;i++){
    const a = state.zooSlots[i];
    const cell=document.createElement('button'); cell.className='zoo-cell glass';
    cell.innerHTML = a ? `<div>${a.emoji}</div><small>${a.name.slice(0,10)}</small><small>Lv.${a.level}</small>` : '<small>+ Empty</small>';
    cell.onclick=()=>onPlace(i); grid.appendChild(cell);
  }
  const inv = document.getElementById('inventory');
  inv.innerHTML = state.animals.filter(a=>a.ownerId===me.id&&!a.locked).slice(0,60).map(cardHtml).join('');
  document.getElementById('zooStats').innerHTML = `<div class="card glass">Animals: ${state.animals.filter(a=>a.ownerId===me.id).length}</div><div class="card glass">Zoo Lv: ${me.playerLevel}</div><div class="card glass">Referrals: ${me.referrals}</div>`;
}

export function renderCases(onOpen){
  const root = document.getElementById('caseList');
  root.innerHTML = Object.entries(CASES).map(([k,c])=>`<div class="card glass"><b>${c.name}</b><p>From ${c.basePrice} coins</p><button class="primary" data-case="${k}">Open</button></div>`).join('');
  root.querySelectorAll('button').forEach(b=>b.onclick=()=>onOpen(b.dataset.case));
}

export function animateRoulette(items){
  const node=document.getElementById('roulette'); node.innerHTML='';
  let i=0; const start=performance.now();
  function frame(t){
    if(t-start>1800){return;}
    if(t-start>i*110){ const a=items[i%items.length]; node.innerHTML = `<div class="animal-card rarity-${a.rarity}">${a.emoji} ${a.name}<br>${a.rarity}</div>` + node.innerHTML; i++; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function renderMarket(state, me, handlers){
  const list = state.marketListings.filter(l=>l.active);
  document.getElementById('marketList').innerHTML = list.map(l=>`<div class="animal-card rarity-${l.rarity}"><b>${l.stats.emoji} ${l.stats.name}</b><br>Lv.${l.stats.level} • ${l.rarity}<br>💰${l.price} • ${l.mode}<br><button class="primary" data-id="${l.id}">${l.mode==='buy'?'Buy':'Bid'}</button></div>`).join('');
  document.querySelectorAll('#marketList button').forEach(b=>b.onclick=()=>handlers.onAction(b.dataset.id));
  const options = state.animals.filter(a=>a.ownerId===me.id && !a.locked).slice(0,20)
    .map(a=>`<option value="${a.id}">${a.emoji} ${a.name} (${a.rarity})</option>`).join('');
  document.getElementById('sellForm').innerHTML = `<select id="sellAnimal">${options}</select><select id="sellMode"><option value="buy">Buy now</option><option value="auction">Auction</option></select><input id="sellPrice" type="number" value="300" /><button class="primary" id="sellBtn">List</button><small>Fee 5%, auto-expire 24h</small>`;
  document.getElementById('sellBtn').onclick=()=>handlers.onCreate();
}

export function renderPvp(state, me){
  document.getElementById('pvpRoster').innerHTML = state.animals.filter(a=>a.ownerId===me.id&&!a.locked).slice(0,9).map(a=>`<label class="animal-card rarity-${a.rarity}"><input type="checkbox" value="${a.id}"/> ${a.emoji} ${a.name}<br>Power ${a.power}</label>`).join('');
}

export function renderLeaders(lines){ document.getElementById('leaderboard').innerHTML = lines.map(l=>`<div>${l}</div>`).join(''); }

export function renderThemes(onTheme){
  document.getElementById('themes').innerHTML = Object.keys(THEMES).map(t=>`<button class="card glass" data-theme="${t}">${t}</button>`).join('');
  document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>onTheme(b.dataset.theme));
}

function cardHtml(a){ return `<div class="animal-card rarity-${a.rarity}">${a.emoji} <b>${a.name}</b><br>${a.rarity}${a.mutation!=='none'?` • ${a.mutation}`:''}<br>⚡${a.power} 💵${a.income}/h</div>`; }
