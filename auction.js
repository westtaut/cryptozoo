import { ECON } from './economy.js';

export class AuctionSystem {
  constructor(state) { this.state = state; }

  placeBid(listingId, bidderId, amount, currency = 'coins') {
    const lot = this.state.marketListings.find((x) => x.id === listingId && x.active && x.mode === 'auction');
    if (!lot) throw new Error('Auction not active');
    if (lot.seller_id === bidderId) throw new Error('Seller cannot bid');
    const player = this.state.players[bidderId];
    const top = lot.current_price || lot.starting_price;
    const minNext = Math.ceil(top * (1 + ECON.minBidStep));
    if (amount < minNext) throw new Error(`Min bid ${minNext}`);
    if (player[currency] < amount) throw new Error('Not enough funds');

    lot.current_price = amount;
    lot.bid_history.push({ bidder_id: bidderId, amount, time: Date.now() });

    if (lot.end_time - Date.now() <= ECON.antiSnipeMs) {
      lot.end_time += ECON.antiSnipeMs;
    }
  }

  settle() {
    const now = Date.now();
    for (const lot of this.state.marketListings.filter((x) => x.mode === 'auction' && x.active && x.end_time <= now)) {
      lot.active = false;
      const animal = this.state.animals.find((a) => a.id === lot.animal_id);
      const winner = lot.bid_history.at(-1);
      if (!animal) continue;
      if (!winner) { animal.locked = false; continue; }
      const buyer = this.state.players[winner.bidder_id];
      if (!buyer || buyer.coins < winner.amount) { animal.locked = false; continue; }

      const fee = Math.floor(winner.amount * ECON.auctionFee);
      buyer.coins -= winner.amount;
      this.state.players[lot.seller_id].coins += winner.amount - fee;
      this.state.treasury += fee;
      animal.ownerId = winner.bidder_id;
      animal.locked = false;
      this.state.salesHistory.unshift({ animal_id: animal.id, rarity: animal.rarity, price: winner.amount, at: Date.now(), side: 'buy' });
    }
  }
}
