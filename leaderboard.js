export class LeaderboardSystem {
  constructor() {
    this.tables = { income: [], rarity: [], pvp: [] };
  }

  rebuild(players) {
    this.tables.income = [...players].sort((a, b) => b.metrics.income - a.metrics.income);
    this.tables.rarity = [...players].sort((a, b) => b.metrics.rareAnimals - a.metrics.rareAnimals);
    this.tables.pvp = [...players].sort((a, b) => b.metrics.pvpWins - a.metrics.pvpWins);
  }

  rewardForRank(rank) {
    if (rank === 1) return 2000;
    if (rank <= 3) return 1200;
    if (rank <= 10) return 700;
    if (rank <= 50) return 300;
    return 120;
  }
}
