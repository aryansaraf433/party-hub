import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function Wheel({ room, me }) {
  const { socket } = useSocket();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const players = room.players;
  const numPlayers = players.length;

  useEffect(() => {
    socket.on('wheelSpinning', (targetAngle) => {
      setRotation(targetAngle);
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
      }, 3000);
    });

    return () => {
      socket.off('wheelSpinning');
    };
  }, [socket]);

  const handleSpin = () => {
    if (spinning || numPlayers === 0 || !me.isHost) return;
    setSpinning(true);

    // Pick a random winner
    const winnerIndex = Math.floor(Math.random() * numPlayers);
    const winner = players[winnerIndex];

    // Calculate rotation to land on the winner's slice
    const sliceAngle = 360 / numPlayers;
    const spins = 5; // 5 full rotations
    // The pointer is at the top (0 degrees). We want the center of the winner's slice to be at the top.
    // CSS rotation goes clockwise. We add the current rotation so it always spins forward.
    const currentRotations = Math.floor(rotation / 360) * 360;
    const targetAngle = currentRotations + spins * 360 - (winnerIndex * sliceAngle + sliceAngle / 2);
    
    // Notify server to start spinning for everyone and handle state transition
    socket.emit('startSpin', { targetAngle, winnerId: winner.id });
  };

  return (
    <div className="card action-card">
      <h2>The Wheel</h2>
      <p>{me.isHost ? 'Spin the wheel to select a target!' : 'Waiting for the host to spin the wheel...'}</p>
      
      <div className="wheel-container">
        <div className="wheel-pointer"></div>
        <div 
          className="wheel" 
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Background conic gradient */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: numPlayers > 0 ? `conic-gradient(from 0deg, ${players.map((_, i) => {
              const start = (360 / numPlayers) * i;
              const end = (360 / numPlayers) * (i + 1);
              const colors = ['#d11e1e', '#1e88e5', '#4caf50', '#ffcc00', '#ff9800', '#9c27b0'];
              const color = colors[i % colors.length];
              return `${color} ${start}deg ${end}deg`;
            }).join(', ')})` : '#eee',
            zIndex: -1,
            borderRadius: '50%',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
          }}></div>

          {/* Lines separating slices */}
          {players.map((_, index) => {
            const angle = (360 / numPlayers) * index;
            return (
              <div 
                key={`line-${index}`}
                style={{
                  position: 'absolute',
                  top: 0, left: '50%',
                  width: '4px',
                  height: '50%',
                  backgroundColor: '#fff',
                  transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  zIndex: 0
                }}
              />
            );
          })}

          {players.map((p, index) => {
            const angle = (360 / numPlayers) * index;
            return (
              <div 
                key={p.id}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${angle + (180/numPlayers)}deg) translateY(-110px)`,
                  fontWeight: '900',
                  fontSize: '1.2rem',
                  color: '#fff',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(0,0,0,0.8), 1px -1px 0px rgba(0,0,0,0.8), -1px 1px 0px rgba(0,0,0,0.8), 1px 1px 0px rgba(0,0,0,0.8)',
                  textTransform: 'uppercase',
                  zIndex: 1
                }}
              >
                {p.name}
              </div>
            );
          })}
        </div>
      </div>

      {me.isHost ? (
        <button 
          className="spin-btn" 
          onClick={handleSpin} 
          disabled={spinning || numPlayers < 2}
        >
          {spinning ? 'Spinning...' : 'Spin Wheel'}
        </button>
      ) : (
        <button className="spin-btn" disabled>
          {spinning ? 'Spinning...' : 'Waiting for Host...'}
        </button>
      )}
    </div>
  );
}
