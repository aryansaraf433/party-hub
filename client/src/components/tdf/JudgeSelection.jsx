import { useSocket } from '../../context/SocketContext';

export default function JudgeSelection({ room, me }) {
  const { socket } = useSocket();
  const targetId = room.turnState.targetPlayerId;
  const targetPlayer = room.players.find(p => p.id === targetId);

  const isTarget = me?.id === targetId;

  const handleSelectJudge = (judgeId) => {
    socket.emit('selectJudge', judgeId);
  };

  if (!isTarget) {
    return (
      <div className="card action-card">
        <h2 style={{ textTransform: 'uppercase', color: 'var(--primary-color)' }}>
          {room.turnState.selectedMode} SELECTED
        </h2>
        <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
          🎯 {targetPlayer?.name} is selecting a Judge...
        </p>
      </div>
    );
  }

  // Filter out the target themselves
  const potentialJudges = room.players.filter(p => p.id !== targetId);

  return (
    <div className="card action-card">
      <h2>You are the Target!</h2>
      <p>Select someone to be your Judge:</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {potentialJudges.map(p => (
          <button key={p.id} onClick={() => handleSelectJudge(p.id)} style={{ padding: '1rem' }}>
            ⚖️ {p.name}
          </button>
        ))}
        {potentialJudges.length === 0 && (
          <p>Not enough players to select a judge!</p>
        )}
      </div>
    </div>
  );
}
