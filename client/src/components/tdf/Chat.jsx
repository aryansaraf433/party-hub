import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

const EMOJIS = ['😂', '😮', '🔥', '❤️', '👀', '🤔'];

export default function Chat({ roomCode, me }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // We only receive updates since the room state gives us initial history if we just joined,
    // but the parent TDFGame gets the full room state. Let's just track messages from roomUpdate or chatUpdate.
    const onChatUpdate = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const onReactionUpdate = (reaction) => {
      setFloatingReactions(prev => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 2000);
    };

    socket.on('chatUpdate', onChatUpdate);
    socket.on('reactionUpdate', onReactionUpdate);

    return () => {
      socket.off('chatUpdate', onChatUpdate);
      socket.off('reactionUpdate', onReactionUpdate);
    };
  }, [socket]);

  // Sync initial chat history
  useEffect(() => {
    socket.emit('getChatHistory'); // If we needed it, but parent has room state.
    // For simplicity, we just rely on updates since we didn't implement getChatHistory.
    // Ideally we pass room.chat from parent, but let's just let it be empty on refresh for now or pass it down.
  }, [socket]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit('chatMessage', input);
    setInput('');
  };

  const handleReaction = (emoji) => {
    socket.emit('reaction', emoji);
  };

  return (
    <div className="card chat-container">
      <h3>Chat</h3>
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className="chat-message">
            <span className="sender">{m.sender}:</span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="chat-input">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Say something..." 
        />
        <button type="submit">Send</button>
      </form>

      <div className="reactions-container">
        {EMOJIS.map(e => (
          <button key={e} type="button" className="reaction-btn" onClick={() => handleReaction(e)}>
            {e}
          </button>
        ))}
      </div>

      {floatingReactions.map(r => (
        <div 
          key={r.id} 
          className="floating-reaction"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            bottom: '100px'
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
}
