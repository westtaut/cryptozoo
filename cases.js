export class CaseEngine {
  constructor(registry, economy, animationEngine) {
    this.registry = registry;
    this.economy = economy;
    this.animationEngine = animationEngine;
    this.rarityTable = [
      { rarity: "common", chance: 0.6 },
      { rarity: "rare", chance: 0.25 },
      { rarity: "epic", chance: 0.1 },
      { rarity: "legendary", chance: 0.04 },
      { rarity: "mythic", chance: 0.01 },
    ];
  }

  determineRarity(rng = Math.random) {
    const corrected = this.rarityTable.map((item) => ({ ...item, chance: item.chance * this.economy.dynamicState.dropCorrection }));
    const sum = corrected.reduce((s, v) => s + v.chance, 0);
    let roll = rng() * sum;
    for (const row of corrected) {
      roll -= row.chance;
      if (roll <= 0) return row.rarity;
    }
    return "common";
  }

  openCase(playerId) {
    const rarity = this.determineRarity();
    const base = this.registry.randomByRarity(rarity);
    const animal = this.registry.generateInstance(base, playerId);
    const isUltraRare = Math.random() < 0.0005;
    return { rarity, animal, isUltraRare, effects: isUltraRare ? ["screen-flash", "rainbow-burst"] : [] };
  }

  async openCaseWithRoulette(container, playerId) {
    const result = this.openCase(playerId);
    const reel = this.buildRouletteReel(result.rarity, result.animal.baseId);
    await this.animationEngine.playRoulette(container, reel, result.animal.baseId);
    if (result.isUltraRare) this.animationEngine.playUltraRareBurst();
    return result;
  }

  buildRouletteReel(targetRarity, winningId) {
    const reel = [];
    for (let i = 0; i < 28; i += 1) {
      const rarity = i === 22 ? targetRarity : this.determineRarity();
      const animal = i === 22
        ? this.registry.getById(winningId)
        : this.registry.randomByRarity(rarity);
      reel.push({ id: animal.id, emoji: animal.emoji, rarity: animal.rarity, name: animal.name });
    }
    return reel;
  }
}
