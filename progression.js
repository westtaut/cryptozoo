export class ProgressionSystem {
  constructor() {
    this.milestones = [
      { level: 2, unlock: "market" },
      { level: 3, unlock: "auction" },
      { level: 4, unlock: "pvp" },
      { level: 5, unlock: "breeding" },
      { level: 7, unlock: "seasons" },
      { level: 10, unlock: "prestige" },
    ];
  }

  xpToNext(level) { return Math.round(120 * (1.35 ** (level - 1))); }

  apply(player, gainedXp) {
    player.xp += gainedXp;
    const unlocked = [];
    while (player.xp >= this.xpToNext(player.level)) {
      player.xp -= this.xpToNext(player.level);
      player.level += 1;
      this.milestones.filter((m) => m.level === player.level).forEach((m) => unlocked.push(m.unlock));
    }
    return unlocked;
  }
}
