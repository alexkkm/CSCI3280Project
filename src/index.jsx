// Basic tools
import React from 'react';
import ReactDOM from 'react-dom/client';
import AudioPlayer from './AudioScript/AudioPlayer';

// Addictional decoration 
import './index.css';

// App() function are the main function of the webpage
export default function App() {
  return (
    // React Router
    <div id="mainApp">
    <AudioPlayer/>
    </div>
  );
}

// the most outter layer Dom render, render the App() function to index.html
ReactDOM.createRoot(document.getElementById('root')).render(<App />);