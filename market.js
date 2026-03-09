const FEE = 0.05;
export class MarketSystem {
  constructor(state){ this.state=state; }
  createListing(animal, sellerId, mode='buy', price=100, durationH=24){
    if(this.state.marketListings.filter(l=>l.seller_id===sellerId && l.active).length>=20) throw new Error('Лимит активных лотов');
    if(animal.ownerId!==sellerId || animal.locked) throw new Error('Нельзя выставить это животное');
    animal.locked = true;
    const now = Date.now();
    const listing = { id:crypto.randomUUID(), seller_id:sellerId, animal_id:animal.id, rarity:animal.rarity, stats:animal, mode, price,
      created_at:now, expiration_time:now+durationH*3600*1000, active:true, bids:[] };
    this.state.marketListings.push(listing); return listing;
  }
  buy(listingId,buyerId,currency='coins'){
    const l = this.state.marketListings.find(x=>x.id===listingId && x.active && x.mode==='buy'); if(!l) throw new Error('Лот недоступен');
    const animal = this.state.animals.find(a=>a.id===l.animal_id); if(!animal) throw new Error('Животное не найдено');
    const payer = this.state.players[buyerId]; if(payer[currency] < l.price) throw new Error('Недостаточно средств');
    payer[currency]-=l.price;
    const net = Math.floor(l.price*(1-FEE)); this.state.players[l.seller_id][currency]+=net; this.state.treasury+=l.price-net;
    animal.ownerId=buyerId; animal.locked=false; l.active=false;
    this.state.salesHistory.unshift({animal_id:animal.id,price:l.price,rarity:animal.rarity,at:Date.now()});
  }
  cleanupExpired(){
    const now = Date.now();
    this.state.marketListings.forEach(l=>{ if(l.active && l.expiration_time < now){ l.active=false; const a=this.state.animals.find(x=>x.id===l.animal_id); if(a) a.locked=false; } });
  }
}
