const axios = require('axios');
const { simulateRouteTraffic } = require('../utils/trafficSimulator');
const { tagRoutes } = require('../utils/aiScoring');
const { predictCongestionLevel } = require('../ml/predictor');

// Call Python ML server, fallback to JS predictor
async function mlPredict(features) {
  try {
    const res = await axios.post('http://localhost:5001', features, { timeout: 2000 });
    return res.data;
  } catch {
    return predictCongestionLevel(features);
  }
}

// Geocode using Nominatim
async function geocode(place) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1&countrycodes=in`;
  const res = await axios.get(url, { headers: { 'User-Agent': 'TrafficAI/1.0' }, timeout: 8000 });
  if (!res.data.length) throw new Error(`Location not found: ${place}`);
  return {
    lat: parseFloat(res.data[0].lat),
    lng: parseFloat(res.data[0].lon),
    name: res.data[0].display_name,
  };
}

// Fetch REAL road routes from OSRM (returns actual road geometry)
async function fetchOSRMRoutes(originCoords, destCoords) {
  // OSRM with alternatives=true gives up to 3 real road routes
  const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?alternatives=true&geometries=geojson&overview=full&steps=false&annotations=false`;
  const res = await axios.get(url, { timeout: 12000 });
  if (res.data.code !== 'Ok') throw new Error('OSRM routing failed');
  return res.data.routes || [];
}

// NHAI toll estimation based on distance and route type
function estimateToll(distanceKm, routeIndex) {
  const tollRates = [1.8, 0.5, 0]; // highway, city, bypass
  const base = Math.round((distanceKm * tollRates[routeIndex]) / 10) * 10;
  return Math.max(0, base);
}

// Generate offset geometry when OSRM fails
function generateFallbackGeometry(origin, dest, variant) {
  const offsets = [0, 0.03, -0.03];
  const off = offsets[variant] || 0;
  // Create a curved path with intermediate waypoints
  const points = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.lat + (dest.lat - origin.lat) * t + off * Math.sin(Math.PI * t);
    const lng = origin.lng + (dest.lng - origin.lng) * t + off * 0.5 * Math.sin(Math.PI * t);
    points.push([lng, lat]);
  }
  return { type: 'LineString', coordinates: points };
}

async function buildRoutes(origin, destination) {
  const [originCoords, destCoords] = await Promise.all([
    geocode(origin),
    geocode(destination),
  ]);

  let osrmRoutes = [];
  try {
    osrmRoutes = await fetchOSRMRoutes(originCoords, destCoords);
  } catch (e) {
    console.warn('OSRM unavailable, using fallback geometry:', e.message);
  }

  const hour = new Date().getHours();
  const routeNames = ['Via Highway', 'Via City Road', 'Via Bypass'];
  const routeCount = Math.min(Math.max(osrmRoutes.length, 3), 3);

  const routes = await Promise.all(
    Array.from({ length: routeCount }, async (_, i) => {
      const osrm = osrmRoutes[i];
      const distanceKm = osrm ? osrm.distance / 1000 : 45 + i * 12 + Math.random() * 10;
      const traffic = simulateRouteTraffic(distanceKm, i);

      const mlPrediction = await mlPredict({
        trafficVolume: Math.round(200 + traffic.congestion * 700),
        avgSpeed: traffic.avgSpeed,
        weather: 'Clear',
        rainMm: 0,
        accident: false,
        event: false,
        publicTransportDensity: 40 + i * 15,
        hour,
      });

      const toll = estimateToll(distanceKm, i);

      return {
        id: `route_${i}`,
        name: routeNames[i] || `Route ${i + 1}`,
        distance: parseFloat(distanceKm.toFixed(1)),
        // Use REAL OSRM geometry (actual road path) or fallback
        geometry: osrm?.geometry || generateFallbackGeometry(originCoords, destCoords, i),
        ...traffic,
        toll,
        mlCongestionLevel: mlPrediction.congestionLevel,
        mlConfidence: mlPrediction.confidence,
        mlFactors: mlPrediction.factors || [],
        isTollFree: toll === 0,
      };
    })
  );

  const taggedRoutes = tagRoutes(routes);
  return {
    origin: { ...originCoords, label: origin },
    destination: { ...destCoords, label: destination },
    routes: taggedRoutes,
  };
}

module.exports = { buildRoutes, geocode };
