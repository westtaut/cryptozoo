import { rollRarity, generateAnimalFromRarity } from './animals.js';

export const CASES = {
  starter:{name:'Starter Case', basePrice:180, weights:{common:72,rare:22,epic:5,legendary:0.9,mythic:0.1}},
  jungle:{name:'Jungle Case', basePrice:390, weights:{common:58,rare:28,epic:10,legendary:3,mythic:1}},
  ocean:{name:'Ocean Case', basePrice:620, weights:{common:52,rare:30,epic:12,legendary:4,mythic:2}},
  legendary:{name:'Legendary Case', basePrice:1300, weights:{common:35,rare:35,epic:20,legendary:8,mythic:2}},
  mythic:{name:'Mythic Case', basePrice:2600, weights:{common:20,rare:30,epic:30,legendary:15,mythic:5}}
};

export function spinCase(caseKey){
  const box = CASES[caseKey] || CASES.starter;
  const rarity = weightedRarity(box.weights) || rollRarity();
  return generateAnimalFromRarity(rarity);
}

function weightedRarity(weights){
  const sum = Object.values(weights).reduce((a,b)=>a+b,0);
  let r=Math.random()*sum;
  for(const [k,v] of Object.entries(weights)){ r-=v; if(r<=0) return k; }
}
