export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

export const RARITY_MULTIPLIERS = {
  Common: 1,
  Rare: 3,
  Epic: 8,
  Legendary: 20,
  Mythic: 50,
};

const MUTATIONS = ['None', 'Golden', 'Albino', 'Cyber', 'Shadow'];
const EMOJIS = ['🐼','🐯','🦁','🦊','🐺','🐵','🦄','🦅','🦈','🐙','🐧','🦒','🦍','🦣','🐲'];
const BIOMES = ['Jungle', 'Ocean', 'Arctic', 'Savanna', 'Cyber'];

function rarityStats(rarity) {
  const ranges = {
    Common: { baseIncome: [5, 18], power: [8, 30] },
    Rare: { baseIncome: [20, 60], power: [35, 95] },
    Epic: { baseIncome: [65, 160], power: [100, 260] },
    Legendary: { baseIncome: [170, 360], power: [280, 580] },
    Mythic: { baseIncome: [380, 900], power: [620, 1400] },
  };
  return ranges[rarity];
}

function fromRange(min, max, seed) {
  return Math.floor(min + (max - min) * seed);
}

const animals = [];
let id = 1;
RARITIES.forEach((rarity, rarityIndex) => {
  const { baseIncome, power } = rarityStats(rarity);
  for (let i = 0; i < 60; i += 1) {
    const seed = ((i * 17 + rarityIndex * 31) % 100) / 100;
    animals.push({
      id,
      name: `${BIOMES[i % BIOMES.length]} ${rarity} Beast ${i + 1}`,
      emoji: EMOJIS[(id - 1) % EMOJIS.length],
      rarity,
      base_income: fromRange(baseIncome[0], baseIncome[1], seed),
      power: fromRange(power[0], power[1], 1 - seed),
      luck: 1 + (i % 10),
      speed: 1 + (i % 6),
      defaultLevel: 1,
      mutationPool: MUTATIONS,
      unique: false,
    });
    id += 1;
  }
});


export const ANIMALS = animals;
