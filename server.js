const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 2e6 });

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('join-room', ({ name, roomCode }) => {
    socket.join(roomCode);
    socket.data.name = name;
    socket.data.room = roomCode;
    socket.to(roomCode).emit('system-message', name + ' joined the room');
  });

  socket.on('chat-message', (text) => {
    if (!socket.data.room) return;
    io.to(socket.data.room).emit('chat-message', { name: socket.data.name, message: text });
  });

  socket.on('media-message', (data) => {
    if (!socket.data.room) return;
    io.to(socket.data.room).emit('media-message', { name: socket.data.name, url: data.url, type: data.type });
  });

  socket.on('call-user', (data) => {
    if (!socket.data.room) return;
    socket.to(socket.data.room).emit('call-made', { offer: data.offer, from: socket.id, callType: data.callType });
  });

  socket.on('make-answer', (data) => {
    if (!socket.data.room) return;
    socket.to(socket.data.room).emit('answer-made', { answer: data.answer, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    if (!socket.data.room) return;
    socket.to(socket.data.room).emit('ice-candidate', { candidate: data.candidate });
  });

  socket.on('end-call', () => {
    if (!socket.data.room) return;
    socket.to(socket.data.room).emit('call-ended');
  });

  socket.on('disconnect', () => {
    if (socket.data.room) {
      socket.to(socket.data.room).emit('system-message', socket.data.name + ' left the room');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
