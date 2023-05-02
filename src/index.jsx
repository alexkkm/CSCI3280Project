// Basic tools
import React from 'react';
import ReactDOM from 'react-dom/client';
import AudioPlayer from './AudioScript/AudioPlayer';

// Addictional decoration 
import './index.css';

import { useEffect } from 'react';
import io from 'socket.io-client';

import axios from 'axios';


const socket = io('http://localhost:3001');

export default function App() {
  useEffect(() => {
    // Fetch the client's public IP address
  const fetchIPAddress = async () => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      const ipAddress = response.data.ip;
      // Send the IP address to the server
      socket.emit('broadcast-ip', ipAddress);
    } catch (error) {
      console.error('Failed to fetch IP address:', error);
    }
  };

  fetchIPAddress();

  socket.on('peer-ip', (ip) => {
    console.log('Received peer IP:', ip);
  });
  }, []);

  return (
    // React Router
    <div id="mainApp">
    <AudioPlayer/>
    </div>
  );
}

// the most outter layer Dom render, render the App() function to index.html
ReactDOM.createRoot(document.getElementById('root')).render(<App />);