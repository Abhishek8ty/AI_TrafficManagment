const { buildRoutes } = require('../services/routeService');
const { getWeather } = require('../services/weatherService');
const { predictCongestion, generateHeatmapPoints } = require('../utils/trafficSimulator');
const { getActiveAlerts } = require('../services/alertService');
const Route = require('../models/Route');

async function searchRoute(req, res) {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination are required' });
  }

  try {
    const routeData = await buildRoutes(origin, destination);
    const { origin: originCoords, destination: destCoords, routes } = routeData;

    // Parallel: weather + alerts + prediction
    const midLat = (originCoords.lat + destCoords.lat) / 2;
    const midLng = (originCoords.lng + destCoords.lng) / 2;

    const [weather, alerts] = await Promise.all([
      getWeather(midLat, midLng),
      getActiveAlerts(midLat, midLng),
    ]);

    // Apply weather ETA multiplier
    const weatherMultiplier = weather.impact.etaMultiplier;
    const adjustedRoutes = routes.map(r => ({
      ...r,
      eta: Math.round(r.eta * weatherMultiplier),
    }));

    // AI prediction for best route
    const bestRoute = adjustedRoutes.find(r => r.tag === 'ai_recommended') || adjustedRoutes[0];
    const prediction = predictCongestion(bestRoute.congestion);

    // Heatmap
    const heatmap = generateHeatmapPoints(midLat, midLng, 50);

    // Save to DB (non-blocking)
    Route.create({ origin, destination, routes: adjustedRoutes }).catch(() => {});

    res.json({
      origin: originCoords,
      destination: destCoords,
      routes: adjustedRoutes,
      weather,
      prediction,
      heatmap,
      alerts,
    });
  } catch (err) {
    console.error('Route search error:', err.message);
    res.status(500).json({ error: err.message || 'Route calculation failed' });
  }
}

async function getSuggestions(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=in`;
    const axios = require('axios');
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'TrafficAI/1.0' },
      timeout: 5000,
    });
    const suggestions = response.data.map(item => ({
      label: item.display_name.split(',').slice(0, 3).join(', '),
      full: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
    res.json(suggestions);
  } catch {
    res.json([]);
  }
}

module.exports = { searchRoute, getSuggestions };
