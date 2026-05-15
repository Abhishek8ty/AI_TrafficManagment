const { generateRandomAlert } = require('../services/alertService');
const { simulateRouteTraffic, generateHeatmapPoints } = require('../utils/trafficSimulator');
const { getAllCameraData } = require('../services/cameraService');

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial camera data
    getAllCameraData().then(data => {
      socket.emit('camera:update', data);
    }).catch(() => {});

    // Live traffic updates every 12s
    const trafficInterval = setInterval(() => {
      const liveData = {
        vehicleCount: Math.round(1200 + Math.random() * 800),
        avgSpeed: Math.round(25 + Math.random() * 40),
        congestionIndex: parseFloat((0.3 + Math.random() * 0.6).toFixed(2)),
        timestamp: new Date(),
      };
      socket.emit('traffic:update', liveData);
    }, 12000);

    // Camera/YOLO data every 20s
    const cameraInterval = setInterval(async () => {
      try {
        const data = await getAllCameraData();
        socket.emit('camera:update', data);
      } catch {}
    }, 20000);

    // Random alert every 45-90s
    const alertInterval = setInterval(async () => {
      if (Math.random() > 0.4) {
        const alert = await generateRandomAlert(28.6139, 77.2090);
        socket.emit('alert:new', alert);
      }
    }, 45000 + Math.random() * 45000);

    // Heatmap refresh every 25s
    const heatmapInterval = setInterval(() => {
      const heatmap = generateHeatmapPoints(28.6139, 77.2090, 60);
      socket.emit('heatmap:update', heatmap);
    }, 25000);

    socket.on('disconnect', () => {
      clearInterval(trafficInterval);
      clearInterval(cameraInterval);
      clearInterval(alertInterval);
      clearInterval(heatmapInterval);
      console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = { initSocket };
