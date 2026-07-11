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

// 🎯 UPGRADE: Tambahkan pencarian kata mentah (~"gym|fitness",i) untuk mengatasi salah tag di Indonesia
function buildOverpassQuery(lat, lon, radiusInMeters, type) {
  const gymQuery = `
    node["leisure"="fitness_centre"](around:${radiusInMeters},${lat},${lon});
    way["leisure"="fitness_centre"](around:${radiusInMeters},${lat},${lon});
    node["sport"="fitness"](around:${radiusInMeters},${lat},${lon});
    node["name"~"gym|fitness|sanggar",i](around:${radiusInMeters},${lat},${lon});
    way["name"~"gym|fitness|sanggar",i](around:${radiusInMeters},${lat},${lon});
  `;

  const foodQuery = `
    node["shop"="health_food"](around:${radiusInMeters},${lat},${lon});
    node["amenity"="restaurant"]["diet:vegetarian"="yes"](around:${radiusInMeters},${lat},${lon});
    node["name"~"salad|sehat|vegetarian|vegan|organik|juice",i](around:${radiusInMeters},${lat},${lon});
    way["name"~"salad|sehat|vegetarian|vegan|organik|juice",i](around:${radiusInMeters},${lat},${lon});
  `;

  return `[out:json][timeout:30];(
    ${type === 'gym' ? gymQuery : foodQuery}
  );out center;`;
}

export async function fetchLocationsWithAutoExpand(lat, lon, type) {
  const checkpoints = [10000, 25000, 50000];
  
  for (let radius of checkpoints) {
    try {
      const query = buildOverpassQuery(lat, lon, radius, type);
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      if (!res.ok) continue;
      
      const rawData = await res.json();
      const elements = rawData.elements || [];
      
      if (elements.length >= 2 || radius === 50000) {
        return elements.map(item => {
          const itemLat = item.lat || item.center?.lat;
          const itemLon = item.lon || item.center?.lon;
          return {
            id: item.id,
            name: item.tags.name || (type === 'gym' ? 'Pusat Kebugaran Lokal' : 'Kedai Nutrisi Sehat'),
            lat: itemLat,
            lon: itemLon,
            address: item.tags['addr:street'] || item.tags['addr:full'] || 'Terpetakan di jaringan regional',
            distance: getHaversineDistance(lat, lon, itemLat, itemLon),
            currentRadiusKM: radius / 1000
          };
        }).sort((a, b) => a.distance - b.distance);
      }
    } catch (err) {
      console.error(`Eror radius ${radius}m:`, err);
    }
  }
  return [];
}
