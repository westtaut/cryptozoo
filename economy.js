const rarityMultiplier = { common: 1, rare: 1.8, epic: 3.2, legendary: 6.5, mythic: 12 };
const mutationMultiplier = { None: 1, Golden: 1.2, Albino: 1.35, Cyber: 1.6, Shadow: 2.1, Prismatic: 3.5 };

export class EconomyEngine {
  constructor() {
    this.formulas = this.buildFormulaMatrix();
    this.dynamicState = {
      inflationIndex: 1,
      dropCorrection: 1,
      rewardCorrection: 1,
      upgradeCorrection: 1,
      casePriceCorrection: 1,
    };
  }

  buildFormulaMatrix() {
    const matrix = [];
    for (let i = 1; i <= 320; i += 1) {
      matrix.push({
        id: `F-${i}`,
        value: (x, y = 1) => (Math.log1p(x * i) + Math.sqrt(y + i)) / (1 + i * 0.005),
      });
    }
    return matrix;
  }

  calculateAnimalIncome(animal, zooLevel, boosts = {}) {
    const levelMultiplier = 1 + (animal.level - 1) * 0.12;
    const statMultiplier = (animal.stats.power * 0.35 + animal.stats.speed * 0.25 + animal.stats.luck * 0.4) / 100;
    const mutation = mutationMultiplier[animal.mutation] ?? 1;
    const boostMultiplier = 1 + (boosts.globalIncome ?? 0) + (boosts.eventIncome ?? 0);
    return animal.baseIncome * rarityMultiplier[animal.rarity] * levelMultiplier * (1 + statMultiplier) * mutation * boostMultiplier;
  }

  calculateZooIncome(animals, player, boosts = {}) {
    const raw = animals.reduce((sum, animal) => sum + this.calculateAnimalIncome(animal, player.zooLevel, boosts), 0);
    const zooLevelMultiplier = 1 + player.zooLevel * 0.06;
    const prestigeMultiplier = 1 + player.prestige * 0.2;
    return raw * zooLevelMultiplier * prestigeMultiplier * this.dynamicState.rewardCorrection;
  }

  upgradeCost(baseCost, level) {
    return Math.round(baseCost * (1.15 ** level) * this.dynamicState.upgradeCorrection);
  }

  casePrice(baseCasePrice, playerLevel, growthFactor = 0.08) {
    return Math.round(baseCasePrice * (1 + playerLevel * growthFactor) * this.dynamicState.casePriceCorrection);
  }

  pvpReward(playerLevel, streak = 0, rankTier = 5) {
    return Math.round((80 + playerLevel * 18) * (1 + streak * 0.06) * (1 + (6 - rankTier) * 0.15));
  }

  dailyReward(baseReward, streakDays, playerLevel) {
    return Math.round(baseReward * (1 + streakDays * 0.15) * (1 + playerLevel * 0.04) * this.dynamicState.rewardCorrection);
  }

  referralReward(playerLevel, invitedPlayerLevel) {
    return Math.round((120 + playerLevel * 25) * (1 + invitedPlayerLevel * 0.05));
  }

  eventReward(baseReward, eventMultiplier, playerLevel) {
    return Math.round(baseReward * eventMultiplier * (1 + playerLevel * 0.05));
  }

  marketFee(amount, fee = 0.05) {
    return Math.round(amount * fee);
  }

  analyzeAndBalance(metrics) {
    const avgIncome = metrics.avgIncome ?? 0;
    const targetIncome = metrics.targetIncome ?? 800;
    const caseOpens = metrics.caseOpens ?? 0;
    const sinkRate = metrics.sinkRate ?? 0.18;

    const pressure = avgIncome / Math.max(targetIncome, 1);
    this.dynamicState.inflationIndex = 0.8 * this.dynamicState.inflationIndex + 0.2 * pressure;

    if (pressure > 1.3) {
      this.dynamicState.upgradeCorrection = Math.min(1.9, this.dynamicState.upgradeCorrection + 0.04);
      this.dynamicState.casePriceCorrection = Math.min(2.1, this.dynamicState.casePriceCorrection + 0.05);
      this.dynamicState.rewardCorrection = Math.max(0.75, this.dynamicState.rewardCorrection - 0.03);
      this.dynamicState.dropCorrection = Math.max(0.82, this.dynamicState.dropCorrection - 0.015);
    } else if (pressure < 0.8) {
      this.dynamicState.upgradeCorrection = Math.max(0.8, this.dynamicState.upgradeCorrection - 0.03);
      this.dynamicState.casePriceCorrection = Math.max(0.82, this.dynamicState.casePriceCorrection - 0.04);
      this.dynamicState.rewardCorrection = Math.min(1.4, this.dynamicState.rewardCorrection + 0.04);
      this.dynamicState.dropCorrection = Math.min(1.2, this.dynamicState.dropCorrection + 0.02);
    }

    if (caseOpens > 140) this.dynamicState.dropCorrection *= 0.985;
    if (sinkRate < 0.12) this.dynamicState.rewardCorrection *= 0.97;
    return this.dynamicState;
  }
}

export const RARITY_MULTIPLIER = rarityMultiplier;
export const MUTATION_MULTIPLIER = mutationMultiplier;
