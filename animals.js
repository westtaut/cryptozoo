export const rarityMultipliers = { common: 1, rare: 1.55, epic: 2.35, legendary: 4.6, mythic: 8.8, ultra: 24 };
export const rarityColors = { common: 'var(--common)', rare: 'var(--rare)', epic: 'var(--epic)', legendary: 'var(--legendary)', mythic: 'var(--mythic)', ultra: 'var(--ultra)' };
export const mutationBoosts = { none: 1, Golden: 1.4, Albino: 1.25, Cyber: 1.55, Shadow: 1.7 };

let DB = [];

export async function loadAnimalDatabase() {
  if (DB.length) return DB;
  const res = await fetch('./animals.json');
  DB = await res.json();
  return DB;
}

export function rollRarity() {
  if (Math.random() < 0.0004) return 'ultra'; // <0.05%
  const table = [['common', 60], ['rare', 25], ['epic', 10], ['legendary', 4], ['mythic', 1]];
  const r = Math.random() * 100;
  let acc = 0;
  for (const [rarity, weight] of table) {
    acc += weight;
    if (r <= acc) return rarity;
  }
  return 'common';
}

export function generateAnimalFromRarity(rarity, pool = DB) {
  const actualPool = rarity === 'ultra' ? pool.filter((a) => a.rarity === 'mythic') : pool.filter((a) => a.rarity === rarity);
  const base = actualPool[Math.floor(Math.random() * actualPool.length)] || pool[0];
  const mutation = Math.random() < 0.14 ? ['Golden', 'Albino', 'Cyber', 'Shadow'][Math.floor(Math.random() * 4)] : 'none';
  const mut = mutationBoosts[mutation];
  const rm = rarityMultipliers[rarity] || 1;
  const roll = () => +(0.85 + Math.random() * 0.6).toFixed(2);
  return {
    id: crypto.randomUUID(),
    ownerId: null,
    locked: false,
    level: 1,
    ...base,
    rarity,
    mutation,
    power: Math.floor(base.basePower * roll() * mut),
    income: +(base.baseIncome * rm * roll() * mut).toFixed(2),
    speed: +(base.baseSpeed * roll()).toFixed(2),
    luck: +(base.baseLuck * roll()).toFixed(2)
  };
}
