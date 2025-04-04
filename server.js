// socket-io-react/server.js
require('dotenv').config(); // Optionnel pour les variables d'environnement
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Autorise votre client React
    credentials: true
  }
});

// Liste des salles et utilisateurs
const roomUsers = {};

io.on('connection', (socket) => {
  console.log(`Nouvelle connexion: ${socket.id}`);

  // Rejoindre une salle
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    
    // Enregistrement de l'utilisateur
    if (!roomUsers[room]) {
      roomUsers[room] = [];
    }
    roomUsers[room].push({ id: socket.id, username });
    
    // Notification
    io.to(room).emit('roomUsers', roomUsers[room]);
    socket.emit('message', {
      username: 'Système',
      text: `Bienvenue dans ${room}, ${username}!`,
      time: new Date().toLocaleTimeString()
    });
    
    socket.to(room).emit('message', {
      username: 'Système',
      text: `${username} a rejoint le chat`,
      time: new Date().toLocaleTimeString()
    });
  });

  // Envoyer un message
  socket.on('sendMessage', ({ room, message, username }) => {
    io.to(room).emit('message', {
      username,
      text: message,
      time: new Date().toLocaleTimeString()
    });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`Déconnexion: ${socket.id}`);
    // Nettoyage des utilisateurs déconnectés
    Object.keys(roomUsers).forEach(room => {
      roomUsers[room] = roomUsers[room].filter(user => user.id !== socket.id);
      io.to(room).emit('roomUsers', roomUsers[room]);
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur Socket.IO sur le port ${PORT}`);
});