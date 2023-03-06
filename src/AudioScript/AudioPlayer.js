import React, { useEffect, useState, useCallback } from 'react';
import { DecodeWav } from './WavDecoder';
import MusicVisualizer from './MusicVisualizer';

function AudioPlayer() {

  const numberToTime = (number) => {
    const minutes = Math.floor(number / 60);
    const seconds = Math.floor(number % 60);
    const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutesString}:${secondsString}`;
  };

  const [fileName, setFileName] = useState(null);
  // const [audioURL, setAudioURL] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioData, setAudioData] = useState(null); // wav audio data
  const [audioSource, setAudioSource] = useState(null); // the audio
  const [isPlayingMusic, setIsPlayingMusic] = useState(false); // is music paying
  const [volumeLevel, setVolumeLevel] = useState(0.5); // music volume level
  const [audioContext, setAudioContext] = useState(null); // holder of the audio and properties
  const [analyser, setAnalyser] = useState(null); // for music visualizer
  const [musicFormat, setMusicFormat] = useState(null); // music format: wav, mp3, null
  const [currentTime, setCurrentTime] = useState(0); // for progress bar
  const [duration, setDuration] = useState(0); // for progress bar

  const handleFileChange = async (event) => {
    handleStopClick();
    var file = event.target.files[0];
    setFileName(file.name);
    const format = file.name.substr(file.name.length - 3);
    setAudioData(null);
    // setAudioURL(URL.createObjectURL(file));
    const newAudioContext = new AudioContext();
    switch (format) {
        case 'wav'||'WAV':
            setMusicFormat('wav');
            const decodedData = await DecodeWav(file);
            setAudioData(decodedData);
            setAudioBuffer(newAudioContext.createBuffer(decodedData.numChannels, decodedData.audioData.length / decodedData.numChannels, decodedData.sampleRate))
            setDuration(decodedData.duration);
            break;
        case 'mp3'||'MP3'||'acc'||'AAC'||'ogg'||'OGG':
          setMusicFormat(format.toLowerCase());
            const response = await fetch(URL.createObjectURL(event.target.files[0]));
            const arrayBuffer = await response.arrayBuffer();
            const decodedAudioData = await newAudioContext.decodeAudioData(arrayBuffer);
            setAudioData(decodedAudioData);
            setAudioBuffer(decodedAudioData);
            setDuration(decodedAudioData.duration);
            break;
        default:
            alert('Unsupported file format, we only support wav, mp3, acc, ogg');
            setAudioData(null);
            setAudioSource(null);
            setAudioContext(null);
            setMusicFormat(null);
        return;
    }
    if (audioSource !== null) {
        audioSource.stop();
    }
    newAudioContext.close();
  };
  
  // Play Music
  const handlePlayClick = () => {
    if (isPlayingMusic === true) return;
    if (musicFormat === null) return;
    setIsPlayingMusic(true);
    if (audioSource !== null && audioSource.context.state === 'suspended') {
      // resume audio
      audioSource.context.resume();
    }
    else {
      // play a new audio
      setCurrentTime(0);
      setOffset(0);
      let newAudioContext;
      if (audioContext === null) newAudioContext = new AudioContext();
      else newAudioContext = audioContext;

      // set analyser
      const analyser = newAudioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(newAudioContext.destination);
      setAnalyser(analyser);

      // set volume
      const gainNode = newAudioContext.createGain();
      gainNode.gain.value = volumeLevel;
      gainNode.connect(analyser);
      
      if (musicFormat === 'wav') {
        for (let channel = 0; channel < audioData.numChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          for (let i = 0; i < audioData.audioData.length; i += audioData.numChannels) {
          channelData[i / audioData.numChannels] = audioData.audioData[i + channel];
          }
        }
      }
      const sourceNode = newAudioContext.createBufferSource();    
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(gainNode);
      sourceNode.start();
      setAudioSource(sourceNode);
      setAudioContext(newAudioContext);
    }
  };
  

  // Pause Music
  const handlePauseClick = () => {
    setIsPlayingMusic(false);
    if (audioSource !== null && audioSource.context.state === 'running') {
    audioSource.context.suspend();
    }
  };
  

  // Stop Music
  const handleStopClick = () => {
    setIsPlayingMusic(false);
    if (audioSource !== null) {
    audioSource.stop();
    setAudioSource(null);
    }
    if (audioContext !== null) {
    audioContext.close();
    setAudioContext(null);
    }
    setOffset(0);
    document.getElementById('progressBar').value = 0;
    setCurrentTime(0);
  };


  // Volume Control
  const handleVolumeChange = (event) => {
    setVolumeLevel(parseFloat(event.target.value));
    if (audioSource !== null) {
    const gainNode = audioContext.createGain();
    console.log('volumeLevel: ', volumeLevel);
    gainNode.gain.value = volumeLevel;
    gainNode.connect(audioContext.destination);
    audioSource.disconnect();
    audioSource.connect(gainNode);
    }
  };

  // Progress Bar
  const [offset, setOffset] = useState(0);
  const setProgressBar = () => {
    if (audioSource === null) return;
    const progressBar = document.getElementById('progressBar');
    let targetTime = progressBar.value;
    setOffset(targetTime);
    
    if (audioSource !== null) {
    audioSource.stop();
    setAudioSource(null);
    }
    
    let newAudioContext;
    if (audioContext !== null) {
    audioContext.close();
    setAudioContext(null);
    newAudioContext = new AudioContext();
    }
    else newAudioContext = audioContext;

      // set analyser
      const analyser = newAudioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(newAudioContext.destination);
      setAnalyser(analyser);

      // set volume
      const gainNode = newAudioContext.createGain();
      gainNode.gain.value = volumeLevel;
      gainNode.connect(analyser);

    if (musicFormat === 'wav') 
    for (let channel = 0; channel < audioData.numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioData.audioData.length; i += audioData.numChannels) {
      channelData[i / audioData.numChannels] = audioData.audioData[i + channel];
      }
    }
    const sourceNode = newAudioContext.createBufferSource();    
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(gainNode);
    sourceNode.start(0, targetTime);
    setAudioSource(sourceNode);
    setAudioContext(newAudioContext);

    if (!isPlayingMusic) {
      sourceNode.context.suspend();
    }
    updateProgressBar();
  }

  const updateProgressBar = useCallback(() => {
    const progressBar = document.getElementById('progressBar');
    let duration = audioData ? audioData.duration : 0;
    let time = audioContext.currentTime - audioSource.context.baseLatency + parseFloat(offset);
    if (time > duration) {
      time = duration;
    }
    progressBar.value = time;
    setCurrentTime(time);
  }, [audioContext, audioData, audioSource, offset]);

  useEffect(() => {
    if (isPlayingMusic) {
      const interval = setInterval(updateProgressBar, 10);
      return () => clearInterval(interval);
    }
  }, [isPlayingMusic, updateProgressBar]);

  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handlePlayClick} disabled={isPlayingMusic || (!audioData)}>
        Play
      </button>
      <button onClick={handlePauseClick} disabled={!isPlayingMusic || (!audioSource)}>
        Pause
      </button>
      <button onClick={handleStopClick} disabled={(!audioSource)}>
        Stop
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volumeLevel}
        onChange={handleVolumeChange}
      />
      <div>
        <input
          type="range"
          id="progressBar"
          min="0"
          max={audioData ? audioData.duration : 0}
          step="0.01"
          style={{width: "400px"}}
          onChange={setProgressBar}
          >
        </input>
        <p>{numberToTime(currentTime)} / {numberToTime(duration)}</p>
      </div>

      {/* <canvas ref={canvasRef} width={500} height={200} /> */}

      
      <MusicVisualizer audioContext={audioContext} analyser={analyser} width={400} height={200} />
      
      {audioData && (
        <div>
          <p>File Name: {fileName}</p>
          <p>File Format: {musicFormat}</p>
          <p>Audio Format: {audioData.format}</p>
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