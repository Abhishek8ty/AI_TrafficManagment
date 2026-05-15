/**
 * AI Route Scoring Engine
 * Score = (ETA efficiency × 40%) + (Low traffic × 30%) + (Low toll × 15%) + (Fuel efficiency × 15%)
 */

function scoreRoute(route, allRoutes) {
  const minETA = Math.min(...allRoutes.map(r => r.eta));
  const maxETA = Math.max(...allRoutes.map(r => r.eta));
  const minToll = Math.min(...allRoutes.map(r => r.toll));
  const maxToll = Math.max(...allRoutes.map(r => r.toll));
  const minFuel = Math.min(...allRoutes.map(r => r.fuelCost));
  const maxFuel = Math.max(...allRoutes.map(r => r.fuelCost));

  const normalize = (val, min, max) =>
    max === min ? 1 : 1 - (val - min) / (max - min);

  const trafficScore = { low: 1, medium: 0.5, high: 0 }[route.trafficLevel] ?? 0.5;

  const etaScore = normalize(route.eta, minETA, maxETA);
  const tollScore = normalize(route.toll, minToll, maxToll);
  const fuelScore = normalize(route.fuelCost, minFuel, maxFuel);

  const score =
    etaScore * 0.4 +
    trafficScore * 0.3 +
    tollScore * 0.15 +
    fuelScore * 0.15;

  return Math.round(score * 100);
}

function tagRoutes(routes) {
  const scored = routes.map(r => ({ ...r, aiScore: scoreRoute(r, routes) }));
  const sorted = [...scored].sort((a, b) => b.aiScore - a.aiScore);

  return scored.map(r => ({
    ...r,
    tag:
      r === sorted[0]
        ? 'ai_recommended'
        : r.eta === Math.min(...routes.map(x => x.eta))
        ? 'fastest'
        : r.toll === Math.min(...routes.map(x => x.toll))
        ? 'cheapest'
        : null,
  }));
}

module.exports = { scoreRoute, tagRoutes };
