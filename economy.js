import { rarityMultipliers } from './animals.js';

export const ECON = {
  cellUpgradeCost:(base,level)=> Math.floor(base * (1.15 ** level)),
  casePrice:(base,playerLevel)=> Math.floor(base * (1 + playerLevel * 0.05)),
  animalUpgradeCost:(base,level)=> Math.floor(base * (1.12 ** level)),
  dailyReward:(base,streak)=> Math.floor(base * (1 + streak*0.15)),
  animalIncome:(a,profitMultiplier=1)=> a.income * rarityMultipliers[a.rarity] * a.level * profitMultiplier * (1 + a.charm / 20),
  zooIncome:(animals,zooLevelMultiplier=1.0)=> animals.reduce((s,a)=>s+ECON.animalIncome(a),0)*zooLevelMultiplier,
  marketEstimate:(a,demand=1)=> a.income * (rarityMultipliers[a.rarity]||1) * a.level * ((a.power+a.luck+a.speed)/3) * demand
};
