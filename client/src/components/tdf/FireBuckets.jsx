import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function FireBuckets({ room, me }) {
  const { socket } = useSocket();
  const [fireNamesInput, setFireNamesInput] = useState(['', '', '']);
  
  // Local state for target dragging
  const [localBuckets, setLocalBuckets] = useState({ heart: null, trash: null, brain: null });
  const [unassignedNames, setUnassignedNames] = useState([]);
  const [initDrag, setInitDrag] = useState(false);

  const { targetPlayerId, judgePlayerId, fireNames, fireBuckets } = room.turnState;
  
  const targetPlayer = room.players.find(p => p.id === targetPlayerId);
  const judgePlayer = room.players.find(p => p.id === judgePlayerId);

  const isJudge = me?.id === judgePlayerId;
  const isTarget = me?.id === targetPlayerId;

  // 1. Judge needs to submit names
  if (fireNames.length === 0) {
    if (isJudge) {
      const handleSubmit = () => {
        if (fireNamesInput.some(n => !n.trim())) return;
        socket.emit('submitFireNames', fireNamesInput);
      };

      const updateName = (idx, val) => {
        const newNames = [...fireNamesInput];
        newNames[idx] = val;
        setFireNamesInput(newNames);
      };

      return (
        <div className="card action-card">
          <h2>FIRE Mode</h2>
          <p>You chose FIRE for {targetPlayer?.name}!</p>
          <p>Enter 3 names (celebrities, mutual friends, characters) for them to sort:</p>
          <div style={{ marginTop: '1rem' }}>
            <input placeholder="Name 1" value={fireNamesInput[0]} onChange={e => updateName(0, e.target.value)} />
            <input placeholder="Name 2" value={fireNamesInput[1]} onChange={e => updateName(1, e.target.value)} />
            <input placeholder="Name 3" value={fireNamesInput[2]} onChange={e => updateName(2, e.target.value)} />
            <button onClick={handleSubmit} style={{ width: '100%' }}>Submit Names</button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="card action-card">
          <h2>FIRE Mode</h2>
          <p>Waiting for {judgePlayer?.name} to pick 3 names...</p>
        </div>
      );
    }
  }

  // Check if result is revealed
  const isRevealed = Object.values(fireBuckets).every(v => v !== null);

  // Initialize unassigned names for target
  if (isTarget && !isRevealed && !initDrag && unassignedNames.length === 0) {
    setUnassignedNames(fireNames);
    setInitDrag(true);
  }

  const handleDragStart = (e, name) => {
    e.dataTransfer.setData('name', name);
  };

  const handleDrop = (e, bucket) => {
    e.preventDefault();
    const name = e.dataTransfer.getData('name');
    
    // Prevent overriding if bucket full
    if (localBuckets[bucket]) return;

    setLocalBuckets(prev => ({ ...prev, [bucket]: name }));
    setUnassignedNames(prev => prev.filter(n => n !== name));
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // necessary to allow drop
  };

  const handleSubmitBuckets = () => {
    if (Object.values(localBuckets).some(v => v === null)) return;
    socket.emit('submitFireBuckets', localBuckets);
  };

  const handleNextRound = () => {
    socket.emit('resolveExecution');
  };

  return (
    <div className="card action-card" style={{ maxWidth: '800px' }}>
      <h2>FIRE Mode</h2>
      <p>Target: <strong>{targetPlayer?.name}</strong></p>
      
      {!isRevealed && isTarget && (
        <p style={{ margin: '1rem 0' }}>Drag the names into the buckets!</p>
      )}

      <div className="buckets-container">
        <div 
          className={`bucket ${localBuckets.heart || fireBuckets.heart ? 'active' : ''}`}
          onDrop={(e) => handleDrop(e, 'heart')}
          onDragOver={handleDragOver}
        >
          <div className="bucket-emoji">❤️</div>
          <div>{isRevealed ? fireBuckets.heart : (localBuckets.heart || 'Heart')}</div>
        </div>

        <div 
          className={`bucket ${localBuckets.trash || fireBuckets.trash ? 'active' : ''}`}
          onDrop={(e) => handleDrop(e, 'trash')}
          onDragOver={handleDragOver}
        >
          <div className="bucket-emoji">🗑️</div>
          <div>{isRevealed ? fireBuckets.trash : (localBuckets.trash || 'Trash')}</div>
        </div>

        <div 
          className={`bucket ${localBuckets.brain || fireBuckets.brain ? 'active' : ''}`}
          onDrop={(e) => handleDrop(e, 'brain')}
          onDragOver={handleDragOver}
        >
          <div className="bucket-emoji">🧠</div>
          <div>{isRevealed ? fireBuckets.brain : (localBuckets.brain || 'Brain')}</div>
        </div>
      </div>

      {!isRevealed && isTarget && (
        <div className="draggables">
          {unassignedNames.map(name => (
            <div 
              key={name} 
              className="draggable-name" 
              draggable 
              onDragStart={(e) => handleDragStart(e, name)}
            >
              {name}
            </div>
          ))}
        </div>
      )}

      {!isRevealed && isTarget && unassignedNames.length === 0 && (
        <button onClick={handleSubmitBuckets} style={{ marginTop: '2rem' }}>
          Reveal to Everyone!
        </button>
      )}

      {!isRevealed && !isTarget && (
        <p style={{ marginTop: '2rem' }}>Waiting for {targetPlayer?.name} to sort the buckets...</p>
      )}

      {isRevealed && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: 'var(--primary-color)' }}>Results Revealed!</h3>
          {(isTarget || isJudge) && (
            <button onClick={handleNextRound} style={{ marginTop: '1rem' }}>
              Next Round
            </button>
          )}
        </div>
      )}
    </div>
  );
}
