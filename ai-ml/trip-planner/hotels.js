/**
 * Mirrors select_hotels(hotels, num_buckets=6) -> list[Hotel]
 */
export function selectHotels(hotels, numBuckets = 6) {
  const priced = [];

  for (const h of hotels) {
    if (h.price == null) continue;

    let price = h.price;

    // Convert string prices to float
    if (typeof price === "string") {
      price = parseFloat(
        price.replace(/₹/g, "").replace(/,/g, "").trim()
      );
    }

    priced.push({ ...h, price });
  }

  if (priced.length === 0) {
    return [];
  }

  const prices = priced.map((h) => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    const best = priced.reduce((acc, h) => {
      const hRating = h.rating || 0;
      const accRating = acc.rating || 0;
      return hRating > accRating ? h : acc;
    }, priced[0]);
    return [normalizeHotel(best)];
  }

  const bucketWidth = (maxPrice - minPrice) / numBuckets;
  const buckets = {};

  for (const h of priced) {
    const bucketIdx = Math.min(
      Math.floor((h.price - minPrice) / bucketWidth),
      numBuckets - 1
    );

    const currentBest = buckets[bucketIdx];
    const hRating = h.rating || 0;

    if (
      currentBest === undefined ||
      hRating > (currentBest.rating || 0)
    ) {
      buckets[bucketIdx] = h;
    }
  }

  const selected = Object.values(buckets).sort(
    (a, b) => a.price - b.price
  );

  return selected.map(normalizeHotel);
}

function normalizeHotel(h) {
  return {
    name: h.name,
    price: h.price,
    rating: h.rating ?? null,
    hotel_class: h.hotel_class ?? null,
    thumbnail: h.thumbnail ?? null,
  };
}