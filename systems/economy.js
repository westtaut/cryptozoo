import { RARITY_MULTIPLIERS } from '../data/animals.js';

export const mutationBoost = {
  None: 1,
  Golden: 1.4,
  Albino: 1.25,
  Cyber: 1.5,
  Shadow: 1.35,
};

export function calcIncome(animal) {
  const rarityMultiplier = RARITY_MULTIPLIERS[animal.rarity] || 1;
  return animal.base_income
    * rarityMultiplier
    * animal.level
    * animal.profit_multiplier
    * (1 + animal.charm / 20)
    * (mutationBoost[animal.mutation] || 1);
}

export function calcAnimalPrice(animal, basePrice = 100) {
  return Math.floor(basePrice
    * (RARITY_MULTIPLIERS[animal.rarity] || 1)
    * animal.level
    * animal.profit_multiplier);
}

export function upgradeCost(basePrice, level) {
  return Math.floor(basePrice * (1.15 ** level));
}

export function battlePower(animal) {
  return animal.power * animal.level * (RARITY_MULTIPLIERS[animal.rarity] || 1);
}
