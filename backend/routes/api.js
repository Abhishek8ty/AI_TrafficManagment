const express = require('express');
const router = express.Router();
const { searchRoute, getSuggestions } = require('../controllers/routeController');
const { getAllCameraData, getHeatmapData, getSignalPlan, INTERSECTIONS } = require('../services/cameraService');

// Route APIs
router.get('/route/search', searchRoute);
router.get('/route/suggestions', getSuggestions);

// Camera / YOLO APIs
router.get('/camera/all', async (req, res) => {
  try {
    const data = await getAllCameraData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camera/heatmap', async (req, res) => {
  try {
    const data = await getHeatmapData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camera/signal/:id', async (req, res) => {
  try {
    const data = await getSignalPlan(req.params.id);
    if (!data) return res.status(404).json({ error: 'Intersection not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/camera/intersections', (req, res) => {
  res.json(INTERSECTIONS);
});

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

module.exports = router;
