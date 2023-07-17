const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const port = 3000;

let whitePlayerId, blackPlayerId;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  res.send('Hello');
});

io.on('connection', (socket) => {
  if(whitePlayerId == null)
  {
    io.to(socket.id).emit('color', 'w');
    whitePlayerId = socket.id;
  }
  else if(blackPlayerId == null)
  {
    io.to(socket.id).emit('color', 'b');
    blackPlayerId = socket.id;
  }
  else {
    io.to(socket.id).emit('color', '');
  }

  socket.on('disconnect', () => {
    if(socket.id == whitePlayerId)
      whitePlayerId = null;
    else if(socket.id == blackPlayerId)
      blackPlayerId = null;
    io.emit('message', 'user disconnected');
  });
  socket.on('movePiece', (arr) => {
    socket.broadcast.emit('movePiece', arr);
  })
  socket.on('message', (msg) => {
    io.emit('message', msg);
  });
});

server.listen(port, () => {
  console.log('listening on http://localhost:' + port);
});