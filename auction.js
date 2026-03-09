export class AuctionSystem {
  constructor(state){ this.state=state; }
  placeBid(listingId,bidder,amount,currency='coins'){
    const l = this.state.marketListings.find(x=>x.id===listingId && x.active && x.mode==='auction'); if(!l) throw new Error('Auction not active');
    const top = l.bids.at(-1)?.amount || l.price;
    if(amount<=top) throw new Error('Bid too low');
    if(this.state.players[bidder][currency]<amount) throw new Error('Not enough funds');
    l.bids.push({bidder,amount,time:Date.now()});
  }
  settle(){
    const now = Date.now();
    for(const l of this.state.marketListings.filter(x=>x.mode==='auction' && x.active && x.expiration_time<=now)){
      l.active=false;
      const winner = l.bids.at(-1); const animal = this.state.animals.find(a=>a.id===l.animal_id);
      if(!animal){continue;}
      if(!winner){animal.locked=false; continue;}
      const buyer=this.state.players[winner.bidder];
      if(buyer.coins<winner.amount){animal.locked=false; continue;}
      const fee = Math.floor(winner.amount*0.05);
      buyer.coins-=winner.amount;
      this.state.players[l.seller_id].coins += winner.amount-fee;
      this.state.treasury += fee;
      animal.ownerId = winner.bidder; animal.locked=false;
      this.state.salesHistory.unshift({animal_id:animal.id,price:winner.amount,rarity:animal.rarity,at:Date.now()});
    }
  }
}
