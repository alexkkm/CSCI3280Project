import React from "react";
import "./App.css";
import AudioPlayer from "./AudioScript/AudioPlayer";
import { useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3001');

export const ThemeContext = React.createContext(null);

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


  const [theme, setTheme] = React.useState("dark");
  const toggleTheme = () => {
    theme === "light" ? setTheme("dark") : setTheme("light")
  };

  return (
    // React Router
    <ThemeContext.Provider value={{theme, toggleTheme}}>
      <div id="mainApp">
        <AudioPlayer/>
      </div>
    </ThemeContext.Provider>
  );
}