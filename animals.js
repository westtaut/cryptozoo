export class AnimalRegistry {
  constructor(database) {
    this.animals = database;
    this.byId = new Map(database.map((a) => [a.id, a]));
    this.byRarity = database.reduce((acc, item) => {
      (acc[item.rarity] ??= []).push(item);
      return acc;
    }, {});
  }

  getById(id) { return this.byId.get(id); }
  getByRarity(rarity) { return this.byRarity[rarity] ?? []; }
  randomByRarity(rarity, rng = Math.random) {
    const list = this.getByRarity(rarity);
    return list.length ? list[Math.floor(rng() * list.length)] : null;
  }

  generateInstance(base, ownerId) {
    const roll = Math.random;
    const mutation = this.rollMutation(roll());
    const bonus = {
      power: 1 + roll() * 0.35,
      speed: 1 + roll() * 0.35,
      luck: 1 + roll() * 0.35,
      income: 1 + roll() * 0.35,
    };
    return {
      uid: crypto.randomUUID(),
      baseId: base.id,
      ownerId,
      level: 1,
      rarity: base.rarity,
      mutation,
      stats: {
        power: Math.round(base.basePower * bonus.power),
        speed: Math.round(base.baseSpeed * bonus.speed),
        luck: Math.round(base.baseLuck * bonus.luck),
      },
      baseIncome: Math.round(base.baseIncome * bonus.income),
      createdAt: Date.now(),
    };
  }

  rollMutation(v) {
    if (v < 0.0005) return "Prismatic";
    if (v < 0.01) return "Shadow";
    if (v < 0.03) return "Cyber";
    if (v < 0.06) return "Albino";
    if (v < 0.1) return "Golden";
    return "None";
  }
}
