const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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

	socket.on('new-music-added', (newMusic) => {
		socket.broadcast.emit('new-music-added', newMusic);
		// Print the new music to the browser
		console.log(newMusic);
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

app.get('/stream/:filename', (req, res) => {
	const filename = req.params.filename;
	const file = musicList.find(music => music.audioPath.includes(filename));
	if (file) {
	 	res.sendFile(path.join(__dirname, file.audioPath));
	} else {
	 	res.status(404).send('File not found');
	}
});

const multer = require('multer');
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/Uploads');
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
	res.status(200).send('File uploaded and stored.');
});