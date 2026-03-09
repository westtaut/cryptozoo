export class QuestSystem {
  constructor(economy) {
    this.economy = economy;
    this.questTemplates = [
      { id: "open_cases", text: "Open 3 cases", type: "cases", target: 3 },
      { id: "upgrade_animals", text: "Upgrade 5 animals", type: "upgrades", target: 5 },
      { id: "win_pvp", text: "Win 2 PvP battles", type: "pvpWins", target: 2 },
      { id: "market_trade", text: "Complete 2 market trades", type: "trades", target: 2 },
    ];
  }

  generateDaily(playerLevel) {
    return this.questTemplates.map((q) => ({
      ...q,
      progress: 0,
      completed: false,
      reward: Math.round(200 * (1 + playerLevel * 0.08) * (1 + q.target * 0.06)),
    }));
  }

  update(quests, type, amount = 1) {
    quests.forEach((q) => {
      if (q.type !== type || q.completed) return;
      q.progress = Math.min(q.target, q.progress + amount);
      q.completed = q.progress >= q.target;
    });
  }
}
