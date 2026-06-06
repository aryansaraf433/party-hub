import { useSocket } from '../../context/SocketContext';

export default function ModeSelection({ room, me }) {
  const { socket } = useSocket();
  const targetId = room.turnState.targetPlayerId;
  const targetPlayer = room.players.find(p => p.id === targetId);

  const isTarget = me?.id === targetId;

  const handleSelectMode = (mode) => {
    socket.emit('selectMode', mode);
  };

  if (!isTarget) {
    return (
      <div className="card action-card">
        <h2>Target Selected!</h2>
        <p style={{ fontSize: '1.5rem', color: 'var(--primary-color)', margin: '1rem 0' }}>
          🎯 {targetPlayer?.name}
        </p>
        <p>Waiting for them to select Truth, Dare, or Fire...</p>
      </div>
    );
  }

  return (
    <div className="card action-card">
      <h2>You are the Target!</h2>
      <p>Choose your fate:</p>
      <div className="options-grid" style={{ marginTop: '2rem' }}>
        <button className="option-btn truth" onClick={() => handleSelectMode('truth')}>TRUTH</button>
        <button className="option-btn dare" onClick={() => handleSelectMode('dare')}>DARE</button>
        <button className="option-btn fire" onClick={() => handleSelectMode('fire')}>FIRE</button>
      </div>
    </div>
  );
}
