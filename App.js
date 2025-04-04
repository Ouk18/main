import React from 'react';
import ChatRoom from './components/ChatRoom';
import './Chat.css'; // Import des styles CSS

function App() {
  return (
    <div className="App">
      <header>
        <h1>Chat en temps réel avec React et Socket.IO</h1>
      </header>
      <main>
        <ChatRoom />
      </main>
    </div>
  );
}

export default App;