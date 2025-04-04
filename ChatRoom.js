import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState('Général');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef(null);
  const [availableRooms, setAvailableRooms] = useState(['Général', 'Salle 1', 'Salle 2']);
  const [usernameError, setUsernameError] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false); // Pas de logique de chargement utilisateur ici

  useEffect(() => {
    socket.on('message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('roomUsers', (users) => {
      console.log(`Utilisateurs dans la salle ${currentRoom}:`, users);
    });

    return () => {
      socket.off('message');
      socket.off('roomUsers');
    };
  }, [currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
    setUsernameError('');
  };

  const handleUsernameSubmit = () => {
    if (username.trim().length >= 3) {
      setUsernameError('');
      setCurrentRoom('Général'); // Définir la salle actuelle sur Général
      setShowChat(true); // Afficher directement le chat
      socket.emit('joinRoom', { username, room: 'Général' }); // Rejoindre automatiquement la salle Général
    } else {
      setUsernameError('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
    }
  };

  const switchRoom = (roomName) => {
    if (showChat && username && roomName !== currentRoom) {
      socket.emit('leaveRoom', { username, room: currentRoom });
      setMessages([]);
      setCurrentRoom(roomName);
      socket.emit('joinRoom', { username, room: roomName });
    } else if (username && !showChat) {
      setCurrentRoom(roomName);
      setShowChat(true);
      socket.emit('joinRoom', { username, room: roomName });
    } else if (!username) {
      alert('Veuillez entrer un nom d\'utilisateur avant de rejoindre une salle.');
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() && username) {
      await socket.emit('sendMessage', { room: currentRoom, message: newMessage, username });
      setNewMessage('');
    }
  };

  const handleInputChange = (event) => {
    setNewMessage(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && newMessage.trim()) {
      sendMessage();
    }
  };

  if (!showChat) {
    return (
      <div className="join-container">
        <h2>Entrez votre nom d'utilisateur</h2>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={handleUsernameChange}
        />
        {usernameError && <p className="error-message">{usernameError}</p>}
        <button onClick={handleUsernameSubmit}>Rejoindre le chat</button> {/* Bouton modifié */}
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h3>Salons disponibles</h3>
        <ul>
          {availableRooms.map((roomName) => (
            <li key={roomName}>
              <button
                onClick={() => switchRoom(roomName)}
                className={roomName === currentRoom ? 'active' : ''}
              >
                {roomName}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="chat">
        <h2>Chat Room: {currentRoom}</h2>
        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.username === username ? 'own-message' : ''} ${msg.username === 'Système' ? 'system-message' : ''}`}
            >
              <div className="message-header">
                <span className="username">{msg.username}</span>
                <span className="message-time">{msg.time}</span>
              </div>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="message-form">
          <input
            type="text"
            placeholder="Message"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <button onClick={sendMessage} disabled={!newMessage.trim()}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;