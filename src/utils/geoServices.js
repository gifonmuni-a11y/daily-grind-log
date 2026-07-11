// Menghitung jarak garis lurus (Haversine Formula)
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Skema Query Overpass API dengan Tag Spesifik OSM
function buildOverpassQuery(lat, lon, radiusInMeters, type) {
  const gymQuery = `
    node["leisure"="fitness_centre"](around:${radiusInMeters},${lat},${lon});
    way["leisure"="fitness_centre"](around:${radiusInMeters},${lat},${lon});
    node["sport"="fitness"](around:${radiusInMeters},${lat},${lon});
  `;

  const foodQuery = `
    node["shop"="health_food"](around:${radiusInMeters},${lat},${lon});
    node["amenity"="restaurant"]["diet:vegetarian"="yes"](around:${radiusInMeters},${lat},${lon});
    node["amenity"="restaurant"]["diet:vegan"="yes"](around:${radiusInMeters},${lat},${lon});
    node["amenity"="restaurant"]["cuisine"="salad"](around:${radiusInMeters},${lat},${lon});
    node["amenity"="restaurant"]["cuisine"="healthy"](around:${radiusInMeters},${lat},${lon});
  `;

  return `[out:json][timeout:30];(
    ${type === 'gym' ? gymQuery : foodQuery}
  );out center;`;
}

// Logika Auto-Expand Radius untuk User Pedesaan
export async function fetchLocationsWithAutoExpand(lat, lon, type) {
  const checkpoints = [10000, 25000, 50000]; // Rentang jarak: 10km, 25km, 50km
  
  for (let radius of checkpoints) {
    try {
      const query = buildOverpassQuery(lat, lon, radius, type);
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      if (!res.ok) continue;
      
      const rawData = await res.json();
      const elements = rawData.elements || [];
      
      // Validasi: Jika hasil memadai atau jangkauan sudah mentok 50KM, eksekusi pemetaan data
      if (elements.length >= 3 || radius === 50000) {
        return elements.map(item => {
          const itemLat = item.lat || item.center?.lat;
          const itemLon = item.lon || item.center?.lon;
          return {
            id: item.id,
            name: item.tags.name || (type === 'gym' ? 'Pusat Kebugaran Klandestin' : 'Kedai Makanan Nutrisi'),
            lat: itemLat,
            lon: itemLon,
            address: item.tags['addr:street'] || item.tags['addr:full'] || 'Lokasi terpetakan di sistem OSM',
            distance: getHaversineDistance(lat, lon, itemLat, itemLon),
            currentRadiusKM: radius / 1000
          };
        }).sort((a, b) => a.distance - b.distance);
      }
    } catch (err) {
      console.error(`Eror pemindaian radius ${radius} meter:`, err);
    }
  }
  return [];
}
