const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join-room', ({ name, roomCode }) => {
    socket.join(roomCode);
    socket.data.name = name;
    socket.data.room = roomCode;
    socket.to(roomCode).emit('system-message', name + ' ने रूम जॉइन किया');
  });

  socket.on('chat-message', (text) => {
    io.to(socket.data.room).emit('chat-message', { name: socket.data.name, message: text });
  });

  socket.on('media-message', (data) => {
    io.to(socket.data.room).emit('media-message', { name: socket.data.name, url: data.url, type: data.type });
  });

  socket.on('call-user', (data) => {
    socket.to(socket.data.room).emit('call-made', { offer: data.offer, from: socket.id, callType: data.callType });
  });

  socket.on('make-answer', (data) => {
    socket.to(socket.data.room).emit('answer-made', { answer: data.answer, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(socket.data.room).emit('ice-candidate', { candidate: data.candidate });
  });

  socket.on('end-call', () => {
    socket.to(socket.data.room).emit('call-ended');
  });

  socket.on('disconnect', () => {
    if (socket.data.room) {
      socket.to(socket.data.room).emit('system-message', socket.data.name + ' ने रूम छोड़ दिया');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
