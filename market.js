export class MarketplaceSystem {
  constructor(economy) {
    this.economy = economy;
    this.listings = [];
  }

  listAnimal({ sellerId, animal, price }) {
    const listing = {
      id: crypto.randomUUID(),
      sellerId,
      animalId: animal.uid,
      rarity: animal.rarity,
      stats: animal.stats,
      level: animal.level,
      income: animal.baseIncome,
      price,
      timestamp: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
    this.listings.push(listing);
    return listing;
  }

  buy(listingId, buyerId, wallets, ownership) {
    const idx = this.listings.findIndex((x) => x.id === listingId);
    if (idx === -1) throw new Error("Listing not found");
    const listing = this.listings[idx];
    if (wallets[buyerId].coins < listing.price) throw new Error("Not enough coins");

    const fee = this.economy.marketFee(listing.price, 0.05);
    wallets[buyerId].coins -= listing.price;
    wallets[listing.sellerId].coins += listing.price - fee;
    ownership[listing.animalId] = buyerId;
    this.listings.splice(idx, 1);
    return { fee, listing };
  }

  filter(criteria = {}) {
    const { rarity, levelMin = 1, incomeMin = 0, minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER } = criteria;
    return this.listings.filter((x) =>
      (!rarity || x.rarity === rarity)
      && x.level >= levelMin
      && x.income >= incomeMin
      && x.price >= minPrice
      && x.price <= maxPrice);
  }

  pruneExpired(now = Date.now()) {
    this.listings = this.listings.filter((x) => x.expiresAt > now);
  }
}
