export class DailyRewardSystem {
  constructor(economy) {
    this.economy = economy;
    this.baseRewards = [100, 120, 160, 220, 300, 420, 650];
  }

  claim(player, todayKey) {
    if (player.lastClaimDay === todayKey) return { ok: false, reason: "already_claimed" };

    const isConsecutive = player.lastClaimDay === todayKey - 1;
    player.streak = isConsecutive ? Math.min(30, player.streak + 1) : 1;
    player.lastClaimDay = todayKey;

    const dayIndex = (player.streak - 1) % 7;
    const base = this.baseRewards[dayIndex];
    const reward = this.economy.dailyReward(base, player.streak, player.level);
    player.coins += reward;

    return { ok: true, reward, streak: player.streak, weekDay: dayIndex + 1 };
  }
}
