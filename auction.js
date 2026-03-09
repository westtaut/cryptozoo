export class AuctionSystem {
  constructor(economy) {
    this.economy = economy;
    this.auctions = [];
  }

  createAuction({ sellerId, animal, startPrice, durationSec }) {
    const auction = {
      id: crypto.randomUUID(),
      sellerId,
      animalId: animal.uid,
      rarity: animal.rarity,
      stats: animal.stats,
      startPrice,
      currentPrice: startPrice,
      highestBidderId: null,
      bids: [],
      endsAt: Date.now() + durationSec * 1000,
    };
    this.auctions.push(auction);
    return auction;
  }

  placeBid(auctionId, bidderId, amount, wallets) {
    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) throw new Error("Auction not found");
    if (Date.now() > auction.endsAt) throw new Error("Auction ended");
    if (amount <= auction.currentPrice) throw new Error("Bid too low");
    if (wallets[bidderId].coins < amount) throw new Error("Insufficient funds");

    auction.currentPrice = amount;
    auction.highestBidderId = bidderId;
    auction.bids.push({ bidderId, amount, ts: Date.now() });

    if (auction.endsAt - Date.now() < 10_000) auction.endsAt += 20_000;
    return auction;
  }

  settle(wallets, ownership) {
    const now = Date.now();
    const settled = [];
    this.auctions = this.auctions.filter((a) => {
      if (a.endsAt > now) return true;
      if (a.highestBidderId) {
        const fee = this.economy.marketFee(a.currentPrice, 0.05);
        wallets[a.highestBidderId].coins -= a.currentPrice;
        wallets[a.sellerId].coins += a.currentPrice - fee;
        ownership[a.animalId] = a.highestBidderId;
      }
      settled.push(a);
      return false;
    });
    return settled;
  }
}
