import { rarityMultipliers } from './animals.js';

export function powerScore(a){ return a.power * a.level * (rarityMultipliers[a.rarity] || 1); }

export function fight(teamA, teamB){
  const scoreA = teamA.reduce((s,a)=>s+powerScore(a),0);
  const scoreB = teamB.reduce((s,a)=>s+powerScore(a),0);
  const win = scoreA >= scoreB;
  return {win, scoreA:Math.round(scoreA), scoreB:Math.round(scoreB), rewards: win ? {coins:140, token:18, pvp:24} : {coins:45, token:4, pvp:6}};
}
