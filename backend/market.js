export function buyListing(state, listingId, buyerId) {
  const idx = state.market.findIndex((item) => item.id === listingId);
  if (idx === -1) return { ok: false, error: 'Listing not found' };
  const listing = state.market[idx];
  const buyer = state.players[buyerId];
  if (!buyer || buyer.coins < listing.price) return { ok: false, error: 'Not enough coins' };
  buyer.coins -= listing.price;
  buyer.animals.push(listing.animal);
  state.market.splice(idx, 1);
  return { ok: true, listing };
}
