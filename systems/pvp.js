import { battlePower } from './economy.js';

export function teamPower(team) {
  return team.reduce((acc, animal) => acc + battlePower(animal), 0);
}

export function runBattle(teamA, teamB) {
  const powerA = teamPower(teamA);
  const powerB = teamPower(teamB);
  const volatilityA = 0.9 + Math.random() * 0.2;
  const volatilityB = 0.9 + Math.random() * 0.2;
  const scoreA = Math.floor(powerA * volatilityA);
  const scoreB = Math.floor(powerB * volatilityB);
  const winner = scoreA >= scoreB ? 'A' : 'B';

  return {
    scoreA,
    scoreB,
    winner,
    rewards: winner === 'A'
      ? { coins: 220, zooToken: 4, pvpPoints: 18 }
      : { coins: 80, zooToken: 1, pvpPoints: 4 },
  };
}
