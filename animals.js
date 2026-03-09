const rarityMultipliers = {common:1, rare:1.6, epic:2.4, legendary:4.2, mythic:8, ultra:18};
const rarityWeights = [ ['common',60], ['rare',25], ['epic',10], ['legendary',4], ['mythic',1] ];
const mutationBoosts = {none:1, Golden:1.4, Albino:1.25, Cyber:1.55, Shadow:1.65};
const emojis = ['🦁','🐯','🐼','🦒','🦊','🐵','🐘','🦅','🦈','🐙','🐢','🦉','🦜','🦓','🦬','🐆','🦛','🦏','🐺','🐍'];

export const ANIMAL_POOL = Array.from({length:300}, (_,i)=>{
  const rarity = i<120?'common':i<195?'rare':i<250?'epic':i<285?'legendary':i<299?'mythic':'ultra';
  return { templateId:`A${i+1}`, name:`Specimen #${String(i+1).padStart(3,'0')}`, emoji:emojis[i%emojis.length], rarity };
});

export function rollRarity(){
  if (Math.random() < 0.0005) return 'ultra';
  const r = Math.random()*100; let acc=0;
  for(const [rarity,w] of rarityWeights){ acc+=w; if(r<=acc) return rarity; }
  return 'common';
}

export function generateAnimalFromRarity(rarity){
  const candidates = ANIMAL_POOL.filter(a=>a.rarity===rarity);
  const base = candidates[Math.floor(Math.random()*candidates.length)] || ANIMAL_POOL[0];
  const m = rarityMultipliers[rarity] || 1;
  const mutation = Math.random()<0.12 ? ['Golden','Albino','Cyber','Shadow'][Math.floor(Math.random()*4)] : 'none';
  const mut = mutationBoosts[mutation];
  const random = () => +(0.8 + Math.random()*0.7).toFixed(2);
  const lvl = 1;
  return {
    id: crypto.randomUUID(), ownerId:null, locked:false, ...base, mutation, level:lvl,
    power: Math.floor(8 * m * random() * mut),
    income: +(4 * m * random() * mut).toFixed(2),
    speed: +(1 * m * random()).toFixed(2),
    luck: +(1 * m * random()).toFixed(2),
    charm: +(1 * m * random()).toFixed(2)
  };
}

export { rarityMultipliers, mutationBoosts };
