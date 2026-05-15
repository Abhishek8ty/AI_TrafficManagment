/**
 * Realistic traffic simulation engine
 * Generates congestion, speed, and prediction data
 */

const TRAFFIC_PATTERNS = {
  morning_peak: { hours: [7, 8, 9, 10], multiplier: 1.8 },
  evening_peak: { hours: [17, 18, 19, 20], multiplier: 2.0 },
  night: { hours: [22, 23, 0, 1, 2, 3, 4, 5], multiplier: 0.4 },
  normal: { multiplier: 1.0 },
};

function getCurrentMultiplier() {
  const hour = new Date().getHours();
  if (TRAFFIC_PATTERNS.morning_peak.hours.includes(hour)) return TRAFFIC_PATTERNS.morning_peak.multiplier;
  if (TRAFFIC_PATTERNS.evening_peak.hours.includes(hour)) return TRAFFIC_PATTERNS.evening_peak.multiplier;
  if (TRAFFIC_PATTERNS.night.hours.includes(hour)) return TRAFFIC_PATTERNS.night.multiplier;
  return TRAFFIC_PATTERNS.normal.multiplier;
}

function getTrafficLevel(congestion) {
  if (congestion >= 0.7) return 'high';
  if (congestion >= 0.4) return 'medium';
  return 'low';
}

function simulateRouteTraffic(baseDistanceKm, routeIndex = 0) {
  const multiplier = getCurrentMultiplier();
  const randomFactor = 0.85 + Math.random() * 0.3;
  const routeVariance = [1.0, 1.15, 1.3][routeIndex] || 1.0;

  const congestion = Math.min(0.95, (multiplier - 0.4) / 1.6 * randomFactor * routeVariance);
  const avgSpeedKmh = Math.max(15, 80 - congestion * 65);
  const etaMinutes = Math.round((baseDistanceKm / avgSpeedKmh) * 60);
  const trafficLevel = getTrafficLevel(congestion);

  // Toll estimation based on distance (NHAI approximate)
  const tollPerKm = 1.5;
  const toll = Math.round(baseDistanceKm * tollPerKm * routeVariance * 0.7 / 10) * 10;

  // Fuel: ~12 km/l city, ~18 km/l highway, petrol ~₹105/l
  const fuelEfficiency = trafficLevel === 'high' ? 10 : trafficLevel === 'medium' ? 14 : 18;
  const fuelLitres = baseDistanceKm / fuelEfficiency;
  const fuelCost = Math.round(fuelLitres * 105);

  // CO2: ~2.3 kg per litre
  const co2Kg = (fuelLitres * 2.3).toFixed(1);

  return {
    congestion: parseFloat(congestion.toFixed(2)),
    avgSpeed: Math.round(avgSpeedKmh),
    eta: etaMinutes,
    trafficLevel,
    toll,
    fuelCost,
    co2: parseFloat(co2Kg),
  };
}

function predictCongestion(currentCongestion) {
  const multiplier = getCurrentMultiplier();
  const nextHourMultiplier = getCurrentMultiplier();
  const probability = Math.round(Math.min(95, currentCongestion * 100 * (nextHourMultiplier / multiplier)));
  const minutesUntil = Math.round(15 + Math.random() * 45);

  return {
    probability,
    minutesUntil,
    expectedLevel: getTrafficLevel(currentCongestion * 1.2),
    accidentRisk: probability > 70 ? 'high' : probability > 40 ? 'medium' : 'low',
  };
}

function generateHeatmapPoints(centerLat, centerLng, count = 40) {
  return Array.from({ length: count }, () => ({
    lat: centerLat + (Math.random() - 0.5) * 0.3,
    lng: centerLng + (Math.random() - 0.5) * 0.3,
    intensity: Math.random(),
  }));
}

module.exports = { simulateRouteTraffic, predictCongestion, generateHeatmapPoints, getTrafficLevel };
