require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const { initSocket } = require('./sockets/trafficSocket');
const { seedInitialAlerts } = require('./services/alertService');

const app = express();
const server = http.createServer(app);

const ALLOWED = ['http://localhost:5173','http://localhost:5174','http://localhost:5175','http://localhost:5176','http://localhost:3000'];

const io = new Server(server, {
  cors: { origin: ALLOWED, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: ALLOWED }));
app.use(express.json());

app.use('/api', apiRoutes);

initSocket(io);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    console.log('MongoDB connected');
    seedInitialAlerts();
  })
  .catch((err) => {
    console.warn('MongoDB unavailable, running without persistence:', err.message);
  });

server.listen(PORT, () => {
  console.log(`Traffic AI backend running on http://localhost:${PORT}`);
});
