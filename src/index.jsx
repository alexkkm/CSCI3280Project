// Basic tools
import React from 'react';
import ReactDOM from 'react-dom/client';
import AudioPlayer from './AudioScript/AudioPlayer';


// Addictional decoration 
//import './index.css';

// Index Page component
class Index extends React.Component {
  render() {
    return (
      <div className="App">
        <h1 id='title' >Music Player</h1>
        <p>CSCI3280 project</p>
      </div>
    );
  }
}

// App() function are the main function of the webpage
export default function App() {
  return (
    // React Router
    <div>
    <Index />
    <AudioPlayer/>
    </div>
  );
}

// the most outter layer Dom render, render the App() function to index.html
ReactDOM.createRoot(document.getElementById('root')).render(<App />);