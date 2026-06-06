const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const setupGameLogic = require('./gameLogic');

const app = express();
app.use(cors());

// Serve Uno static files under /uno
const path = require('path');
app.use('/uno', express.static(path.join(__dirname, 'public', 'uno')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // For development
    methods: ["GET", "POST"]
  }
});

// Initialize game logic
setupGameLogic(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
