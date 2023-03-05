import React, { useEffect, useState, useRef } from 'react';
import { DecodeWav } from './WavDecoder';

function AudioPlayer() {

  const numberToTime = (number) => {
    const minutes = Math.floor(number / 60);
    const seconds = Math.floor(number % 60);
    const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutesString}:${secondsString}`;
  };

  const canvasRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioData, setAudioData] = useState(null); // wav audio data
  const [audioSource, setAudioSource] = useState(null); // the audio
  const [isPlayingMusic, setIsPlayingMusic] = useState(false); // is music paying
  const [volumeLevel, setVolumeLevel] = useState(0.5); // music volume level
  const [audioContext, setAudioContext] = useState(null); // holder of the audio and properties
  const [musicFormat, setMusicFormat] = useState(null); // music format: wav, mp3, null
  const [currentTime, setCurrentTime] = useState(0); // for progress bar
  const [duration, setDuration] = useState(0); // for progress bar

  const handleFileChange = async (event) => {
    handleStopClick();
    var file = event.target.files[0];
    setFileName(file.name);
    const format = file.name.substr(file.name.length - 3);
    setAudioData(null);
    const newAudioContext = new AudioContext();
    switch (format) {
        case 'wav'||'WAV':
            setMusicFormat('wav');
            const decodedData = await DecodeWav(file);
            setAudioData(decodedData);
            setAudioBuffer(newAudioContext.createBuffer(decodedData.numChannels, decodedData.audioData.length / decodedData.numChannels, decodedData.sampleRate))
            setDuration(decodedData.duration);
            break;
        case 'mp3'||'MP3':
          setMusicFormat('mp3');
            const response = await fetch(URL.createObjectURL(event.target.files[0]));
            const arrayBuffer = await response.arrayBuffer();
            const decodedAudioData = await newAudioContext.decodeAudioData(arrayBuffer);
            setAudioData(decodedAudioData);
            setAudioBuffer(decodedAudioData);
            setDuration(decodedAudioData.duration);
            break;
        default:
            alert('Unsupported file format, we only support wav or mp3');
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

      // Analyser
      const analyser = newAudioContext.createAnalyser();
      analyser.connect(newAudioContext.destination);
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      const draw = () => {
        const drawVisual = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();
        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvas.height / 2;
          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      };
      draw();
      

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

    // set volume
    const gainNode = newAudioContext.createGain();
    gainNode.gain.value = volumeLevel;
    gainNode.connect(newAudioContext.destination);
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

  const updateProgressBar = () => {
    const progressBar = document.getElementById('progressBar');
    let duration = audioData ? audioData.duration : 0;
    //console.log('duration: ', duration);
    let time=0;
    // console.log('offset: ', offset);
    time = audioContext.currentTime - audioSource.context.baseLatency + parseFloat(offset);
    // console.log('time: ', time);
    if (time > duration) {
      time = duration;
    }
    // console.log('currentTime: ', time);
    progressBar.value = time;
    setCurrentTime(time);
  }
  useEffect(() => {
    // if isplayingmusic is true, then keep updating the progress bar every 0.1 second until it is false
    if (isPlayingMusic) {
      const interval = setInterval(() => {
        updateProgressBar();
      }
      , 10);
      return () => clearInterval(interval);
    }
  }, [isPlayingMusic, audioContext, audioSource, offset]);

  
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
      
      <canvas ref={canvasRef} width={500} height={200} />

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