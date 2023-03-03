import React, { useState } from 'react';
import { DecodeWav, ClearAudioData } from './WavDecoder';

function AudioPlayer() {
  const [audioData, setAudioData] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [playState, setPlayState] = useState(false);

  const handleFileChange = async (event) => {
    var file = event.target.files[0];
    const format = file.name.substr(file.name.length - 3);
    switch (format) {
        case 'wav'||'WAV':
            break;
        default:
            alert('Unsupported file format');
            setAudioSource(null);
            setAudioData(null);
            return;
    }

    const decodedData = await DecodeWav(file);
    setAudioData(decodedData);
    if (audioSource !== null) {
      audioSource.stop();
    }
  };

  const handlePlayClick = () => {
    if (playState === true) {return}
    setPlayState(true);
    if (audioSource !== null && audioSource.context.state === 'suspended') {
      audioSource.context.resume();
    } else {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = audioContext.createBuffer(audioData.numChannels, audioData.audioData.length / audioData.numChannels, audioData.sampleRate);
      for (let channel = 0; channel < audioData.numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < audioData.audioData.length; i += audioData.numChannels) {
          channelData[i / audioData.numChannels] = audioData.audioData[i + channel];
        }
      }
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      setAudioSource(source);
    }
  };

  const handlePauseClick = () => {
    setPlayState(false);
    if (audioSource !== null && audioSource.context.state === 'running') {
      audioSource.context.suspend();
    }
  };

  const handleStopClick = () => {
    setPlayState(false);
    if (audioSource !== null) {
      audioSource.stop();
      setAudioSource(null);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handlePlayClick} disabled={!audioData}>
        Play
      </button>
      <button onClick={handlePauseClick} disabled={!audioSource}>
        Pause
      </button>
      <button onClick={handleStopClick} disabled={!audioSource}>
        Stop
      </button>
      {audioData && (
        <div>
          <p>Format: {audioData.format}</p>
          <p>Number of Channels: {audioData.numChannels}</p>
          <p>Sample Rate: {audioData.sampleRate}</p>
          <p>Byte Rate: {audioData.byteRate}</p>
          <p>Block Align: {audioData.blockAlign}</p>
          <p>Bit Depth: {audioData.bitDepth}</p>
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;