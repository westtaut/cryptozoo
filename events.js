export class EventSystem {
  constructor(economy) {
    this.economy = economy;
    this.activeEvents = [];
  }

  tick(playerLevel) {
    const now = Date.now();
    this.activeEvents = this.activeEvents.filter((e) => e.endsAt > now);
    if (Math.random() < 0.004) {
      const kinds = ["double_income", "drop_boost", "market_frenzy", "lucky_drop"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const duration = 1000 * 60 * (10 + Math.floor(Math.random() * 30));
      this.activeEvents.push({
        id: crypto.randomUUID(),
        kind,
        multiplier: 1 + Math.min(1.4, playerLevel * 0.03),
        endsAt: now + duration,
      });
    }
  }

  getBoosts() {
    return this.activeEvents.reduce((acc, e) => {
      if (e.kind === "double_income") acc.eventIncome += 1;
      if (e.kind === "drop_boost") acc.dropBoost += 0.25;
      return acc;
    }, { eventIncome: 0, dropBoost: 0 });
  }
}
