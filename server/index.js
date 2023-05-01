const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

app.use(cors());
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log('User connected: ', socket.id);
    socket.on("send_message", (data) => {
        console.log("Message sent.");
        socket.to(data.room).emit("receive_message", data);
    })

    socket.on("join_room", (data) => {
        socket.join(data);
        console.log("User joined.");
    })

})

server.listen(3001, () => {
    console.log("SERVER listening on");
})