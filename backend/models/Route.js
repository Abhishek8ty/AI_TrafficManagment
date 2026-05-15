const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  routes: [{ type: mongoose.Schema.Types.Mixed }],
  searchedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Route', routeSchema);
