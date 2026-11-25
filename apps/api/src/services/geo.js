// Great-circle distance in km between two [lng, lat] points.
function haversineKm([lng1, lat1], [lng2, lat2]) {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const roundKm = (km) => Math.round(km * 10) / 10;
const placeOf = (p) => (p ? { suburb: p.suburb, city: p.city, province: p.province } : null);

module.exports = { haversineKm, roundKm, placeOf };
