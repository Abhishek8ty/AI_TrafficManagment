/**
 * Camera / YOLO Vehicle Detection Service
 * Integrates with the Python smart-traffic system
 * Provides simulated lane counts when YOLO is unavailable
 */

const axios = require('axios');

const CAMERA_API = 'http://localhost:8000';

// Delhi-NCR intersection camera data (simulated from dataset patterns)
const INTERSECTIONS = [
  { id: 'cam_001', name: 'Connaught Place', lat: 28.6315, lng: 77.2167, lanes: 4 },
  { id: 'cam_002', name: 'India Gate', lat: 28.6129, lng: 77.2295, lanes: 3 },
  { id: 'cam_003', name: 'DND Flyway', lat: 28.5942, lng: 77.3053, lanes: 4 },
  { id: 'cam_004', name: 'Cyber Hub Gurgaon', lat: 28.4959, lng: 77.0882, lanes: 4 },
  { id: 'cam_005', name: 'Akshardham Route', lat: 28.6127, lng: 77.2773, lanes: 3 },
  { id: 'cam_006', name: 'Sector 18 Noida', lat: 28.5706, lng: 77.324, lanes: 4 },
  { id: 'cam_007', name: 'Lajpat Nagar', lat: 28.5677, lng: 77.243, lanes: 3 },
  { id: 'cam_008', name: 'Karol Bagh', lat: 28.6519, lng: 77.1909, lanes: 4 },
  { id: 'cam_009', name: 'IGI Airport T3', lat: 28.5562, lng: 77.1, lanes: 4 },
  { id: 'cam_010', name: 'Botanical Garden', lat: 28.5636, lng: 77.334, lanes: 3 },
];

// Traffic patterns from dataset (hour -> multiplier)
const HOUR_PATTERNS = {
  0: 0.2, 1: 0.15, 2: 0.12, 3: 0.1, 4: 0.12, 5: 0.2,
  6: 0.5, 7: 0.85, 8: 1.0, 9: 0.95, 10: 0.75, 11: 0.7,
  12: 0.8, 13: 0.75, 14: 0.7, 15: 0.8, 16: 0.9, 17: 1.0,
  18: 0.95, 19: 0.85, 20: 0.7, 21: 0.55, 22: 0.4, 23: 0.3
};

function getHourMultiplier() {
  return HOUR_PATTERNS[new Date().getHours()] || 0.5;
}

// Simulate YOLO vehicle counts based on dataset patterns
function simulateLaneCounts(intersectionId) {
  const mult = getHourMultiplier();
  const base = 80 + Math.random() * 120;
  const lanes = {};
  const numLanes = INTERSECTIONS.find(i => i.id === intersectionId)?.lanes || 4;
  
  for (let i = 1; i <= numLanes; i++) {
    const variance = 0.7 + Math.random() * 0.6;
    lanes[`lane${i}`] = Math.round(base * mult * variance);
  }
  return lanes;
}

// Proportional green time allocation (from rule_scheduler.py)
function proportionalAllocate(counts, minGreen = 10, maxGreen = 60, cycle = 120) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) + 1e-6;
  const raw = {};
  for (const k in counts) raw[k] = (counts[k] / total) * cycle;
  
  const clipped = {};
  for (const k in raw) clipped[k] = Math.max(minGreen, Math.min(maxGreen, Math.round(raw[k])));
  
  const sum = Object.values(clipped).reduce((a, b) => a + b, 0);
  if (sum !== cycle) {
    const factor = cycle / sum;
    for (const k in clipped) {
      clipped[k] = Math.max(minGreen, Math.min(maxGreen, Math.round(clipped[k] * factor)));
    }
  }
  return clipped;
}

// Try to call real YOLO backend, fallback to simulation
async function getLaneCounts(intersectionId) {
  try {
    const res = await axios.get(`${CAMERA_API}/run`, { timeout: 3000 });
    return { counts: res.data.counts, plan: res.data.plan, source: 'yolo' };
  } catch {
    const counts = simulateLaneCounts(intersectionId);
    const plan = proportionalAllocate(counts);
    return { counts, plan, source: 'simulated' };
  }
}

// Get all intersection camera data
async function getAllCameraData() {
  const results = await Promise.all(
    INTERSECTIONS.map(async (intersection) => {
      const { counts, plan, source } = await getLaneCounts(intersection.id);
      const totalVehicles = Object.values(counts).reduce((a, b) => a + b, 0);
      const congestionLevel = totalVehicles > 300 ? 'Very High' :
                              totalVehicles > 200 ? 'High' :
                              totalVehicles > 100 ? 'Medium' : 'Low';
      return {
        ...intersection,
        counts,
        plan,
        source,
        totalVehicles,
        congestionLevel,
        timestamp: new Date().toISOString(),
      };
    })
  );
  return results;
}

// Get heatmap data from camera intersections
async function getHeatmapData() {
  const cameras = await getAllCameraData();
  return cameras.map(cam => ({
    lat: cam.lat,
    lng: cam.lng,
    intensity: Math.min(1, cam.totalVehicles / 400),
    name: cam.name,
    vehicles: cam.totalVehicles,
    congestion: cam.congestionLevel,
  }));
}

// Get signal plan for a specific intersection
async function getSignalPlan(intersectionId) {
  const intersection = INTERSECTIONS.find(i => i.id === intersectionId);
  if (!intersection) return null;
  const { counts, plan, source } = await getLaneCounts(intersectionId);
  return { intersection, counts, plan, source };
}

module.exports = {
  getAllCameraData,
  getHeatmapData,
  getSignalPlan,
  INTERSECTIONS,
  simulateLaneCounts,
  proportionalAllocate,
};
