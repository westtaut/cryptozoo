export function mintAnimalNFT(animal, ownerAddress) {
  return {
    token_id: `ZOO-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    owner_address: ownerAddress,
    metadata: {
      uid: animal.uid,
      name: animal.name,
      rarity: animal.rarity,
      mutation: animal.mutation,
      power: animal.power,
      level: animal.level,
    },
    standard: 'ERC-721',
  };
}

export function canMintNFT(animal) {
  return ['Legendary', 'Mythic'].includes(animal.rarity);
}
