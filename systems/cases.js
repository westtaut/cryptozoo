import { ANIMALS } from '../data/animals.js';

export const CASES = {
  starter: { name: 'Starter Case', price: 100, drop: { Common: 0.8, Rare: 0.18, Epic: 0.02 } },
  jungle: { name: 'Jungle Case', price: 500, drop: { Common: 0.58, Rare: 0.3, Epic: 0.1, Legendary: 0.02 } },
  ocean: { name: 'Ocean Case', price: 1500, drop: { Common: 0.48, Rare: 0.3, Epic: 0.17, Legendary: 0.045, Mythic: 0.005 } },
  legendary: { name: 'Legendary Case', price: 6000, drop: { Rare: 0.4, Epic: 0.37, Legendary: 0.2, Mythic: 0.03 } },
  mythic: { name: 'Mythic Case', price: 15000, drop: { Epic: 0.45, Legendary: 0.45, Mythic: 0.1 } },
};

const mutationChances = [
  ['Golden', 0.02],
  ['Albino', 0.03],
  ['Cyber', 0.015],
  ['Shadow', 0.02],
];

function pickWeighted(weights) {
  const roll = Math.random();
  let sum = 0;
  for (const [key, chance] of Object.entries(weights)) {
    sum += chance;
    if (roll <= sum) return key;
  }
  return 'Common';
}

function pickMutation() {
  const roll = Math.random();
  let sum = 0;
  for (const [name, chance] of mutationChances) {
    sum += chance;
    if (roll <= sum) return name;
  }
  return 'None';
}

export function generateAnimalDrop(caseId) {
  const selectedCase = CASES[caseId];
  if (!selectedCase) return null;

  const rarity = pickWeighted(selectedCase.drop);
  const pool = ANIMALS.filter((a) => a.rarity === rarity);
  const template = pool[Math.floor(Math.random() * pool.length)] || ANIMALS[0];

  const highTier = rarity === 'Legendary' || rarity === 'Mythic';

  return {
    uid: crypto.randomUUID(),
    template_id: template.id,
    name: template.name,
    emoji: template.emoji,
    rarity,
    base_income: template.base_income,
    level: highTier ? rand(2, 8) : rand(1, 5),
    charm: highTier ? rand(6, 16) : rand(1, 10),
    speed: highTier ? rand(2, 8) : rand(1, 5),
    luck: highTier ? rand(4, 12) : rand(1, 8),
    profit_multiplier: highTier ? randFloat(1.05, 1.85) : randFloat(0.8, 1.3),
    power: template.power + rand(0, highTier ? 80 : 25),
    mutation: pickMutation(),
    nft: null,
  };
}

function rand(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randFloat(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}
