export function rankPlayers(players) {
  const byIncome = [...players].sort((a, b) => b.earnedZooToken - a.earnedZooToken);
  const byPvp = [...players].sort((a, b) => b.pvpWins - a.pvpWins);
  const byRare = [...players].sort((a, b) => b.rareAnimals - a.rareAnimals);
  return { byIncome, byPvp, byRare };
}
