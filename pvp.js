export class PvPSystem {
  constructor(economy) { this.economy = economy; }

  battle(attacker, defender) {
    const attackScore = this.score(attacker);
    const defendScore = this.score(defender);
    const winChance = attackScore / (attackScore + defendScore);
    const isWin = Math.random() < winChance;
    const reward = this.economy.pvpReward(attacker.level, attacker.streak || 0, attacker.rankTier || 5);
    return {
      isWin,
      reward: isWin ? reward : Math.round(reward * 0.25),
      deltaTrophies: isWin ? 20 : -12,
      report: { attackScore, defendScore, winChance },
    };
  }

  score(player) {
    const power = player.animals.reduce((sum, a) => sum + a.stats.power * (1 + a.level * 0.06), 0);
    const speedLuck = player.animals.reduce((sum, a) => sum + a.stats.speed * 0.35 + a.stats.luck * 0.45, 0);
    return power + speedLuck + player.level * 50;
  }
}
