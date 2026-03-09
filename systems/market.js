import { calcAnimalPrice } from './economy.js';

export const MARKET_FEE = 0.05;

export function createListing(playerId, animal, askPrice) {
  return {
    id: crypto.randomUUID(),
    seller: playerId,
    animal,
    price: askPrice || calcAnimalPrice(animal),
    created_at: Date.now(),
  };
}

export function applyMarketFee(price) {
  const fee = Math.floor(price * MARKET_FEE);
  return { sellerGets: price - fee, fee };
}

export function createAuction(playerId, animal, startingPrice) {
  return {
    id: crypto.randomUUID(),
    seller: playerId,
    animal,
    starting_price: startingPrice,
    bid_history: [],
    highest_bid: startingPrice,
    winner: null,
    time_left: 3600,
    created_at: Date.now(),
  };
}

export function placeBid(auction, bidder, amount) {
  if (amount <= auction.highest_bid) return false;
  auction.highest_bid = amount;
  auction.winner = bidder;
  auction.bid_history.push({ bidder, amount, at: Date.now() });
  return true;
}
