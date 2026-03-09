import { ECON } from './economy.js';

export class MarketSystem {
  constructor(state) { this.state = state; }

  createListing(animal, sellerId, mode = 'buy', price = 100, durationH = 24) {
    if (animal.ownerId !== sellerId || animal.locked) throw new Error('Нельзя выставить это животное');
    animal.locked = true;
    const now = Date.now();
    const listing = {
      id: crypto.randomUUID(),
      mode,
      seller_id: sellerId,
      animal_id: animal.id,
      rarity: animal.rarity,
      stats: animal,
      starting_price: price,
      current_price: price,
      bid_history: [],
      created_at: now,
      end_time: now + durationH * 3600 * 1000,
      expiration_time: now + durationH * 3600 * 1000,
      price,
      active: true
    };
    this.state.marketListings.push(listing);
    return listing;
  }

  buy(listingId, buyerId, currency = 'coins') {
    const l = this.state.marketListings.find((x) => x.id === listingId && x.active && x.mode === 'buy');
    if (!l) throw new Error('Лот недоступен');
    const animal = this.state.animals.find((a) => a.id === l.animal_id);
    const payer = this.state.players[buyerId];
    const marketPrice = Math.floor(Math.max(l.price, ECON.priceIndex(animal, this.state.salesHistory)));
    if (payer[currency] < marketPrice) throw new Error('Недостаточно средств');
    payer[currency] -= marketPrice;
    const net = Math.floor(marketPrice * (1 - ECON.auctionFee));
    this.state.players[l.seller_id][currency] += net;
    this.state.treasury += marketPrice - net;
    animal.ownerId = buyerId;
    animal.locked = false;
    l.active = false;
    this.state.salesHistory.unshift({ animal_id: animal.id, price: marketPrice, rarity: animal.rarity, at: Date.now(), side: 'buy' });
  }

  cleanupExpired() {
    const now = Date.now();
    this.state.marketListings.forEach((l) => {
      const ttl = l.mode === 'auction' ? l.end_time : l.expiration_time;
      if (l.active && ttl < now) {
        l.active = false;
        const a = this.state.animals.find((x) => x.id === l.animal_id);
        if (a) a.locked = false;
      }
    });
  }
}
