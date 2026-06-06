import { useSocket } from '../../context/SocketContext';

export default function Lobby({ room, me }) {
  const { socket } = useSocket();

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  return (
    <div className="card action-card">
      <h2>Lobby</h2>
      <p>Waiting for players...</p>
      <div style={{ margin: '2rem 0' }}>
        <h3>Players: {room.players.length}</h3>
        {room.players.length < 3 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Recommend at least 3 players for Truth, Dare, Fire.
          </p>
        )}
      </div>
      
      {me?.isHost ? (
        <button onClick={handleStartGame} className="spin-btn">
          Start Game
        </button>
      ) : (
        <p>Waiting for host to start the game...</p>
      )}
    </div>
  );
}
