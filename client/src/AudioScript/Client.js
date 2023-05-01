import io from 'socket.io-client';
import { useEffect, useState } from 'react';

const socket = io.connect("http://localhost:3001");

function Client() {
  const [message, setMessage] = useState("");
  const [messageReceived, setMessageReceived] = useState("");
  const [room, setRoom] = useState("");

  const sendMessage = () => {
    socket.emit("send_message", {message, room});
  };
  
  const joinRoom = () => {
  if (room !== "") {
    socket.emit("join_room", room);
  }
 };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageReceived(data.message);
    }, [socket]);
  });

  return (
    <div className="Client">
      <input placeholder = "Room Number..." onChange = {(event) => {
        setRoom(event.target.value);
      }}
      />
      <button onClick={joinRoom}> Join Room</button>
      <input placeholder = "Message..." onChange = {(event) => {
        setMessage(event.target.value);
      }}
      />
      <button onClick={sendMessage}> Send Message</button>
      <div style={{color: "white"}}>{messageReceived}</div>
      
    </div>
  );
}

export default Client;
