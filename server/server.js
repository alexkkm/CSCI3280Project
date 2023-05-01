const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors({
	origin: ["http://localhost:3000", "https://alexkkm.github.io"],
	credentials: true,
}));

const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: ["http://localhost:3000", "https://alexkkm.github.io"],
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	// Custom event for broadcasting the IP address of a connected peer
	socket.on('broadcast-ip', (ip) => {
		socket.broadcast.emit('peer-ip', ip);
	});

	socket.on('search', (searchQuery) => {
		socket.broadcast.emit('search', searchQuery);
	});

	socket.on('search-result', (searchResult, originalClientId) => {
		socket.to(originalClientId).emit('search-result', searchResult);
	});

	socket.on('disconnect', () => {
	console.log('User disconnected:', socket.id);
	});
});