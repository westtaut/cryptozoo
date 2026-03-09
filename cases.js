import { rollRarity, generateAnimalFromRarity } from './animals.js';

export const CASES = {
  starter: { name: 'Starter Case', basePrice: 180 },
  jungle: { name: 'Jungle Case', basePrice: 390 },
  abyss: { name: 'Abyss Case', basePrice: 920 },
  apex: { name: 'Apex Case', basePrice: 1800 }
};

export function spinCase(_caseKey, pool) {
  const rarity = rollRarity();
  return generateAnimalFromRarity(rarity, pool);
}
