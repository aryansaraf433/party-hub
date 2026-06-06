import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function ModeExecution({ room, me }) {
  const { socket } = useSocket();
  const [promptInput, setPromptInput] = useState('');
  const [fireNames, setFireNames] = useState(['', '', '']);

  const { targetPlayerId, judgePlayerId, selectedMode, promptText } = room.turnState;
  
  const targetPlayer = room.players.find(p => p.id === targetPlayerId);
  const judgePlayer = room.players.find(p => p.id === judgePlayerId);

  const isJudge = me?.id === judgePlayerId;
  const isTarget = me?.id === targetPlayerId;


  const handleSubmitPrompt = () => {
    if (!promptInput.trim()) return;
    socket.emit('submitPrompt', promptInput);
  };

  const handleResolve = () => {
    socket.emit('resolveExecution');
  };

  const handleFireNameChange = (index, value) => {
    const newNames = [...fireNames];
    newNames[index] = value;
    setFireNames(newNames);
  };

  const handleSubmitFireNames = () => {
    if (fireNames.some(n => !n.trim())) return; // require all 3
    socket.emit('submitFireNames', fireNames);
  };

  // State: Mode execution (Truth/Dare)

  // State: Mode is selected (Truth/Dare)
  // (Fire has its own component, FireBuckets, handled in TDFGame switch)
  if (room.gameState === 'mode_execution') {
    return (
      <div className="card action-card">
        <h2 style={{ textTransform: 'uppercase', color: 'var(--primary-color)' }}>{selectedMode}</h2>
        <p>Target: <strong>{targetPlayer?.name}</strong> | Judge: <strong>{judgePlayer?.name}</strong></p>
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
          {promptText ? (
            <>
              <h3>The {selectedMode === 'truth' ? 'Question' : 'Dare'}:</h3>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>"{promptText}"</p>
              
              {isJudge ? (
                <button onClick={handleResolve} style={{ marginTop: '1rem' }}>
                  Mark as Complete (Resolve)
                </button>
              ) : isTarget ? (
                <p>Answer the question or perform the dare! (The judge will resolve it)</p>
              ) : (
                <p>Waiting for {targetPlayer?.name} to complete it...</p>
              )}
            </>
          ) : (
            <>
              {isJudge ? (
                <div>
                  <p>Enter your {selectedMode}:</p>
                  <input 
                    value={promptInput} 
                    onChange={e => setPromptInput(e.target.value)} 
                    placeholder={`Type your ${selectedMode} here...`}
                  />
                  <button onClick={handleSubmitPrompt}>Submit</button>
                </div>
              ) : (
                <p>Waiting for {judgePlayer?.name} to type the {selectedMode}...</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Should not reach here if fire, as TDFGame routes 'fire_execution' to FireBuckets
  return null;
}
