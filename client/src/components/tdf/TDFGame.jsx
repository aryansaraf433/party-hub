import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import Lobby from './Lobby';
import Chat from './Chat';
import Wheel from './Wheel';
import ModeSelection from './ModeSelection';
import JudgeSelection from './JudgeSelection';
import ModeExecution from './ModeExecution';
import FireBuckets from './FireBuckets';

export default function TDFGame({ onBack }) {
  const { socket, isConnected } = useSocket();
  const [name, setName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket) return;

    const onRoomUpdate = (room) => setRoomState(room);
    
    socket.on('roomUpdate', onRoomUpdate);
    
    return () => {
      socket.off('roomUpdate', onRoomUpdate);
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (!name) return setError('Please enter a name');
    socket.emit('joinRoom', { name, roomCode: null }, (res) => {
      if (res.error) setError(res.error);
      else setError('');
    });
  };

  const handleJoinRoom = () => {
    if (!name || !roomCodeInput) return setError('Please enter a name and room code');
    socket.emit('joinRoom', { name, roomCode: roomCodeInput }, (res) => {
      if (res.error) setError(res.error);
      else setError('');
    });
  };

  const handleLeave = () => {
    socket.emit('leaveRoom');
    setRoomState(null);
    onBack();
  };

  // 1. Not in a room -> Show Name/Room Entry
  if (!roomState) {
    return (
      <div className="app-container">
        <div className="top-bar">
          <button onClick={onBack}>← Back</button>
          <h2>Truth, Dare, Fire</h2>
        </div>
        <div className="main-area">
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
            <h3 style={{ textAlign: 'center' }}>Join or Create Room</h3>
            {error && <p style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{error}</p>}
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
            <button style={{ width: '100%', marginBottom: '1rem' }} onClick={handleCreateRoom}>
              Create New Room
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Room Code" 
                value={roomCodeInput} 
                onChange={e => setRoomCodeInput(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
              <button onClick={handleJoinRoom}>Join</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find me
  const me = roomState.players.find(p => p.id === socket.id);

  // Determine main area component based on state
  let MainComponent = null;
  switch (roomState.gameState) {
    case 'lobby':
      MainComponent = <Lobby room={roomState} me={me} />;
      break;
    case 'spinning':
      MainComponent = <Wheel room={roomState} me={me} />;
      break;
    case 'target_selected':
      MainComponent = <ModeSelection room={roomState} me={me} />;
      break;
    case 'mode_selected':
      MainComponent = <JudgeSelection room={roomState} me={me} />;
      break;
    case 'mode_execution':
      MainComponent = <ModeExecution room={roomState} me={me} />;
      break;
    case 'fire_execution':
      MainComponent = <FireBuckets room={roomState} me={me} />;
      break;
    default:
      MainComponent = <div>Unknown State</div>;
  }

  return (
    <div className="app-container tdf-container">
      <div className="top-bar">
        <button onClick={handleLeave}>Leave Room</button>
        <span className="room-code">Room: {roomState.roomCode}</span>
      </div>
      
      <div className="game-layout">
        <div className="main-area">
          {MainComponent}
        </div>
        
        <div className="side-area">
          <div className="card">
            <h3>Players ({roomState.players.length})</h3>
            <ul className="player-list">
              {roomState.players.map(p => (
                <li key={p.id} className={`player-item ${p.id === socket.id ? 'is-me' : ''}`}>
                  <span>{p.name} {p.isHost ? '(Host)' : ''}</span>
                  {roomState.turnState?.targetPlayerId === p.id && ' 🎯'}
                  {roomState.turnState?.judgePlayerId === p.id && ' ⚖️'}
                </li>
              ))}
            </ul>
          </div>
          <Chat roomCode={roomState.roomCode} me={me} />
        </div>
      </div>
    </div>
  );
}
