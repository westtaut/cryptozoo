import { rarityMultipliers } from './animals.js';

const DAY = 86400000;

function buildFormulaLibrary() {
  const formulas = {};
  for (let i = 1; i <= 220; i++) {
    formulas[`f${i}`] = (x = 1, y = 1, z = 1) => (x * (1 + i * 0.0025) + y * (i % 7) + z * (i % 5)) / (1 + (i % 9) * 0.1);
  }
  return formulas;
}

export const FORMULAS = buildFormulaLibrary();

export const ECON = {
  auctionFee: 0.05,
  minBidStep: 0.03,
  antiSnipeMs: 30000,
  cellUpgradeCost: (base, level, upgradeMultiplier = 1.15) => Math.floor(base * (upgradeMultiplier ** level)),
  casePrice: (baseCasePrice, playerLevel, growthFactor = 0.06) => Math.floor(baseCasePrice * (1 + playerLevel * growthFactor)),
  dailyReward: (base, streak) => Math.floor(base * (1 + streak * 0.12)),
  animalIncome: (a, level = a.level || 1) => {
    const statMultiplier = 1 + ((a.power || 1) + (a.speed || 1) + (a.luck || 1)) / 250;
    const mutationMultiplier = ({ none: 1, Golden: 1.4, Albino: 1.25, Cyber: 1.55, Shadow: 1.7 }[a.mutation] || 1);
    return a.baseIncome * (rarityMultipliers[a.rarity] || 1) * level * statMultiplier * mutationMultiplier;
  },
  zooIncome: (animals, zooLevelMultiplier = 1, prestigeMultiplier = 1) => animals.reduce((sum, a) => sum + ECON.animalIncome(a), 0) * zooLevelMultiplier * prestigeMultiplier,
  demandFactor: (salesHistory, rarity) => {
    const recent = salesHistory.filter((s) => s.at > Date.now() - DAY && s.rarity === rarity);
    const buys = recent.length;
    const sells = recent.filter((s) => s.side === 'sell').length || Math.max(1, Math.floor(recent.length * 0.4));
    return Math.max(0.75, Math.min(1.45, 1 + (buys - sells) / 120));
  },
  averageSalePrice: (salesHistory, animalId = null, rarity = null) => {
    const set = salesHistory.filter((s) => s.at > Date.now() - 30 * DAY && (!animalId || s.animal_id === animalId) && (!rarity || s.rarity === rarity));
    if (!set.length) return 100;
    return set.reduce((a, b) => a + b.price, 0) / set.length;
  },
  priceIndex: (animal, salesHistory) => {
    const averageSalePrice = ECON.averageSalePrice(salesHistory, null, animal.rarity);
    const demandFactor = ECON.demandFactor(salesHistory, animal.rarity);
    const rarityMultiplier = rarityMultipliers[animal.rarity] || 1;
    const statMultiplier = 1 + ((animal.power || 1) + (animal.speed || 1) + (animal.luck || 1)) / 300;
    return averageSalePrice * demandFactor * rarityMultiplier * statMultiplier;
  }
};
