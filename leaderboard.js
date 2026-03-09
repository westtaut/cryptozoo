export function buildLeaderboard(players){
  return Object.values(players)
    .sort((a,b)=>(b.zooTokenEarned-a.zooTokenEarned)||(b.rareCollected-a.rareCollected)||(b.pvpVictories-a.pvpVictories))
    .map((p,i)=>`${i+1}. ${p.name} — 🧬${Math.floor(p.zooTokenEarned)} | 💎${p.rareCollected} | ⚔️${p.pvpVictories}`);
}
