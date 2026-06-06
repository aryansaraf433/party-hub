import { useState } from 'react';
import './App.css';
import TDFGame from './components/tdf/TDFGame';

function App() {
  const [activeGame, setActiveGame] = useState(null);

  if (activeGame === 'tdf') {
    return <TDFGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'uno') {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

    return (
      <div className="app-container">
        <div className="top-bar" style={{ marginBottom: '1rem' }}>
          <button onClick={() => setActiveGame(null)}>← Back to Menu</button>
          <h2>Uno</h2>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <iframe 
            src={`${SERVER_URL}/uno`} 
            className="uno-frame"
            title="Uno Game"
            allow="clipboard-write"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-menu">
        <h1>Party Hub</h1>
        <p>Select a game to start playing with your friends!</p>
        <div className="game-options">
          <div className="u-menu-card-container" onClick={() => setActiveGame('uno')}>
            <div className="action-text">Play</div>
            <div className="gradient-glow"></div>
            <div className="u-menu-card">
              <h2>Uno</h2>
              <p>Classic Card Game</p>
            </div>
          </div>
          
          <div className="u-menu-card-container" onClick={() => setActiveGame('tdf')}>
            <div className="action-text">Play</div>
            <div className="gradient-glow" style={{ filter: 'hue-rotate(180deg) brightness(1.3)' }}></div>
            <div className="u-menu-card">
              <h2>Truth, Dare, Fire</h2>
              <p>Ultimate Party Game</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
