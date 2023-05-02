const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = require('socket.io')(server, {
	cors: {
	  origin: 'http://localhost:3000',
	  methods: ['GET', 'POST'],
	  allowedHeaders: ['my-custom-header'],
	  credentials: true
	}
  });

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	// Fetch the public IP address of the server using an IIFE with an async function
	(async () => {
		try {
		  const response = await axios.get('https://api.ipify.org?format=json');
		  const ipAddress = response.data.ip;
		  console.log('Server IP Address:', ipAddress);
		} catch (error) {
		  console.error('Failed to fetch IP address:', error);
		}
	  })();

	// Get the IP address of the connected client
	const ipAddress = socket.handshake.address;
	console.log('Connected client IP address:', ipAddress);
  
  
	// Custom event for broadcasting the IP address of a connected peer
	socket.on('broadcast-ip', (ip) => {
	  socket.broadcast.emit('peer-ip', ip);
	});
  
	socket.on('disconnect', () => {
	  console.log('User disconnected:', socket.id);
	});
});