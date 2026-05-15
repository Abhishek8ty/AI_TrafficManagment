const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['accident', 'rain', 'roadblock', 'vip', 'emergency'], required: true },
  message: { type: String, required: true },
  location: { lat: Number, lng: Number },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 },
});

module.exports = mongoose.model('Alert', alertSchema);
