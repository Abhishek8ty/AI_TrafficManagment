const Alert = require('../models/Alert');

const ALERT_TEMPLATES = [
  { type: 'accident', message: 'Multi-vehicle accident reported. Expect 20-30 min delay.', severity: 'high' },
  { type: 'rain', message: 'Heavy rainfall reducing visibility. Drive cautiously.', severity: 'medium' },
  { type: 'roadblock', message: 'Road maintenance work. One lane closed.', severity: 'medium' },
  { type: 'vip', message: 'VIP convoy movement. Expect 10-15 min delay.', severity: 'low' },
  { type: 'emergency', message: 'Emergency vehicle corridor active on this route.', severity: 'high' },
];

// In-memory alerts for when MongoDB is unavailable
let memoryAlerts = [];

async function getActiveAlerts(lat, lng) {
  try {
    const alerts = await Alert.find({ active: true }).sort({ createdAt: -1 }).limit(5);
    return alerts;
  } catch {
    return memoryAlerts.filter(a => a.active).slice(0, 5);
  }
}

async function generateRandomAlert(lat, lng) {
  const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
  const alert = {
    ...template,
    location: {
      lat: lat + (Math.random() - 0.5) * 0.1,
      lng: lng + (Math.random() - 0.5) * 0.1,
    },
    active: true,
    createdAt: new Date(),
    _id: Date.now().toString(),
  };

  try {
    const doc = await Alert.create(alert);
    return doc;
  } catch {
    memoryAlerts.push(alert);
    if (memoryAlerts.length > 20) memoryAlerts = memoryAlerts.slice(-10);
    return alert;
  }
}

async function seedInitialAlerts() {
  // Default Delhi area alerts
  const defaults = [
    { type: 'accident', message: 'Accident on NH48 near Dhaula Kuan. Right lane blocked.', severity: 'high', location: { lat: 28.5921, lng: 77.1580 } },
    { type: 'rain', message: 'Heavy rain forecast for next 2 hours. Expect slowdowns.', severity: 'medium', location: { lat: 28.6139, lng: 77.2090 } },
  ];

  for (const d of defaults) {
    try {
      await Alert.create({ ...d, active: true });
    } catch {
      memoryAlerts.push({ ...d, active: true, _id: Date.now().toString() + Math.random(), createdAt: new Date() });
    }
  }
}

module.exports = { getActiveAlerts, generateRandomAlert, seedInitialAlerts };
