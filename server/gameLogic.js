const crypto = require('crypto');

// In-memory store for rooms
const rooms = new Map();

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
}

function getInitialTurnState() {
  return {
    targetPlayerId: null,
    judgePlayerId: null,
    selectedMode: null,
    promptText: null,
    fireNames: [],
    fireBuckets: { heart: null, "trash": null, "brain": null }
  };
}

module.exports = function setupGameLogic(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('joinRoom', ({ name, roomCode }, callback) => {
      let room = rooms.get(roomCode);
      let isHost = false;

      // Create room if it doesn't exist and no code was provided
      if (!roomCode) {
        roomCode = generateRoomCode();
        isHost = true;
        room = {
          roomCode,
          players: [],
          gameState: 'lobby',
          chat: [],
          turnState: getInitialTurnState()
        };
        rooms.set(roomCode, room);
      } else if (!room) {
        return callback({ error: 'Room not found' });
      }

      // Check if player name exists
      if (room.players.find(p => p.name === name)) {
        return callback({ error: 'Name already taken in this room' });
      }

      const player = { id: socket.id, name, isHost };
      room.players.push(player);

      socket.join(roomCode);
      socket.data.roomCode = roomCode; // save on socket for disconnect

      io.to(roomCode).emit('roomUpdate', room);
      callback({ success: true, roomCode });
    });

    // Chat
    socket.on('chatMessage', (text) => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const msg = {
        id: crypto.randomUUID(),
        sender: player.name,
        text,
        timestamp: Date.now()
      };
      
      // Keep last 50 messages
      room.chat.push(msg);
      if(room.chat.length > 50) room.chat.shift();

      io.to(roomCode).emit('chatUpdate', msg);
    });

    // Reactions
    socket.on('reaction', (emoji) => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      
      const player = rooms.get(roomCode)?.players.find(p => p.id === socket.id);
      if (!player) return;

      io.to(roomCode).emit('reactionUpdate', {
        id: crypto.randomUUID(),
        emoji,
        senderId: player.id,
        senderName: player.name,
        timestamp: Date.now()
      });
    });

    // Game Actions
    socket.on('startGame', () => {
      const roomCode = socket.data.roomCode;
      const room = rooms.get(roomCode);
      if (room && room.players.find(p => p.id === socket.id)?.isHost) {
        room.gameState = 'spinning';
        room.turnState = getInitialTurnState();
        io.to(roomCode).emit('roomUpdate', room);
      }
    });

    socket.on('startSpin', ({ targetAngle, winnerId }) => {
      const room = rooms.get(socket.data.roomCode);
      if (room && room.gameState === 'spinning' && room.players.find(p => p.id === socket.id)?.isHost) {
        // Broadcast spinning animation
        io.to(room.roomCode).emit('wheelSpinning', targetAngle);
        
        // Wait 3s on the server before updating game state to prevent clients from skipping animation
        setTimeout(() => {
          const currentRoom = rooms.get(room.roomCode);
          if (currentRoom && currentRoom.gameState === 'spinning') {
            currentRoom.gameState = 'target_selected';
            currentRoom.turnState.targetPlayerId = winnerId;
            io.to(currentRoom.roomCode).emit('roomUpdate', currentRoom);
          }
        }, 3000);
      }
    });

    socket.on('spinWheel', (targetPlayerId) => {
      const room = rooms.get(socket.data.roomCode);
      if (room && room.gameState === 'spinning') {
        room.gameState = 'target_selected';
        room.turnState.targetPlayerId = targetPlayerId;
        io.to(room.roomCode).emit('roomUpdate', room);
      }
    });

    socket.on('selectMode', (mode) => {
      const room = rooms.get(socket.data.roomCode);
      if (room && room.gameState === 'target_selected' && socket.id === room.turnState.targetPlayerId) {
        room.turnState.selectedMode = mode;
        room.gameState = 'mode_selected';
        io.to(room.roomCode).emit('roomUpdate', room);
      }
    });

    socket.on('selectJudge', (judgePlayerId) => {
      const room = rooms.get(socket.data.roomCode);
      if (room && room.gameState === 'mode_selected' && socket.id === room.turnState.targetPlayerId) {
        room.turnState.judgePlayerId = judgePlayerId;
        room.gameState = room.turnState.selectedMode === 'fire' ? 'fire_execution' : 'mode_execution';
        io.to(room.roomCode).emit('roomUpdate', room);
      }
    });

    socket.on('submitPrompt', (text) => {
      const room = rooms.get(socket.data.roomCode);
      if (room && room.gameState === 'mode_execution' && socket.id === room.turnState.judgePlayerId) {
        room.turnState.promptText = text;
        io.to(room.roomCode).emit('roomUpdate', room);
      }
    });

    socket.on('submitFireNames', (names) => {
      const room = rooms.get(socket.data.roomCode);
      if (room && room.gameState === 'fire_execution' && socket.id === room.turnState.judgePlayerId) {
        room.turnState.fireNames = names;
        io.to(room.roomCode).emit('roomUpdate', room);
      }
    });

    socket.on('submitFireBuckets', (buckets) => {
      const room = rooms.get(socket.data.roomCode);
      if (room && room.gameState === 'fire_execution' && socket.id === room.turnState.targetPlayerId) {
        room.turnState.fireBuckets = buckets;
        io.to(room.roomCode).emit('roomUpdate', room);
      }
    });

    socket.on('resolveExecution', () => {
      const room = rooms.get(socket.data.roomCode);
      // Only judge can resolve Truth/Dare. Anyone (or target) can resolve Fire after submission.
      // We'll let target or judge resolve for simplicity here.
      if (room && (socket.id === room.turnState.targetPlayerId || socket.id === room.turnState.judgePlayerId)) {
        room.gameState = 'spinning';
        room.turnState = getInitialTurnState();
        io.to(room.roomCode).emit('roomUpdate', room);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;

      const room = rooms.get(roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          // Reassign host if host left
          if (!room.players.find(p => p.isHost)) {
            room.players[0].isHost = true;
          }
          io.to(roomCode).emit('roomUpdate', room);
        }
      }
    });
  });
};
