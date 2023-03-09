import React, { useEffect, useState, useCallback } from 'react';
import { DecodeWav } from './WavDecoder';
import MusicVisualizer from './MusicVisualizer';
import LrcDisplayer from './LrcDisplayer';
import musicList from '../MusicDatabase/musicList';
import "../index.css"

export default function AudioPlayer() {

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
    const [currentMusic, setCurrentMusic] = useState(null); // for database and lyric
    const [playMode, setPlayMode] = useState('single'); // for play mode, single, loop, random


    // Load music from database
    const loadMusic = async (audioTitle) => {
        // Find the object in the JSON data that contains the audioTitle
        const audioObj = musicList.find(obj => obj.audioTitle === audioTitle);
        if (!audioObj) {
            alert(`Audio file not found for title: ${audioTitle}`);
            return;
        }

        // Create a new File object from the audio path in the object
        const file = new File([await fetch(audioObj.audioPath).then(response => response.blob())], audioObj.audioPath);
        setCurrentMusic(audioObj);
        handleStopClick();
        setFileName(file.name);
        const format = file.name.substr(file.name.length - 3);
        setAudioData(null);
        // setAudioURL(URL.createObjectURL(file));
        const newAudioContext = new AudioContext();
        switch (format.toLowerCase()) {
            case 'wav':
                setMusicFormat('wav');
                const decodedData = await DecodeWav(file);
                setAudioData(decodedData);
                setAudioBuffer(newAudioContext.createBuffer(decodedData.numChannels, decodedData.audioData.length / decodedData.numChannels, decodedData.sampleRate))
                setDuration(decodedData.duration);
                break;
            case 'mp3':
            case 'aac':
            case 'ogg':
                setMusicFormat(format.toLowerCase());
                const response = await fetch(URL.createObjectURL(file));
                const arrayBuffer = await response.arrayBuffer();
                const decodedAudioData = await newAudioContext.decodeAudioData(arrayBuffer);
                setAudioData(decodedAudioData);
                setAudioBuffer(decodedAudioData);
                setDuration(decodedAudioData.duration);
                break;
            default:
                alert('Unsupported file format, we only support wav, mp3, aac, ogg');
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



    const handleFileChange = async (event) => {
        setCurrentMusic(null);
        handleStopClick();
        var file = event.target.files[0];
        setFileName(file.name);
        const format = file.name.substr(file.name.length - 3);
        setAudioData(null);
        // setAudioURL(URL.createObjectURL(file));
        const newAudioContext = new AudioContext();
        switch (format.toLowerCase()) {
            case 'wav':
                setMusicFormat('wav');
                const decodedData = await DecodeWav(file);
                setAudioData(decodedData);
                setAudioBuffer(newAudioContext.createBuffer(decodedData.numChannels, decodedData.audioData.length / decodedData.numChannels, decodedData.sampleRate))
                setDuration(decodedData.duration);
                break;
            case 'mp3':
            case 'aac':
            case 'ogg':
                setMusicFormat(format.toLowerCase());
                const response = await fetch(URL.createObjectURL(event.target.files[0]));
                const arrayBuffer = await response.arrayBuffer();
                const decodedAudioData = await newAudioContext.decodeAudioData(arrayBuffer);
                setAudioData(decodedAudioData);
                setAudioBuffer(decodedAudioData);
                setDuration(decodedAudioData.duration);
                break;
            default:
                alert('Unsupported file format, we only support wav, mp3, aac, ogg');
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

        console.log('play');
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
            gainNode.connect(analyser);
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


    // handle PlayMode
    useEffect(() => {
        if (audioContext === null) return;

        const loadAndPlayMusic = async (audioTitle) => {

            // Find the object in the JSON data that contains the audioTitle
            const audioObj = musicList.find(obj => obj.audioTitle === audioTitle);
            if (!audioObj) {
                alert(`Audio file not found for title: ${audioTitle}`);
                return;
            }

            // Create a new File object from the audio path in the object
            const file = new File([await fetch(audioObj.audioPath).then(response => response.blob())], audioObj.audioPath);
            setCurrentMusic(audioObj);
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
            setFileName(file.name);
            const format = file.name.substr(file.name.length - 3);
            let decodedAudioData;
            let decodedAudioBuffer;
            setAudioData(null);
            // setAudioURL(URL.createObjectURL(file));
            const new2AudioContext = new AudioContext();
            switch (format.toLowerCase()) {
                case 'wav':
                    setMusicFormat('wav');
                    decodedAudioData = await DecodeWav(file);
                    setAudioData(decodedAudioData);
                    decodedAudioBuffer = (new2AudioContext.createBuffer(decodedAudioData.numChannels, decodedAudioData.audioData.length / decodedAudioData.numChannels, decodedAudioData.sampleRate))
                    setAudioBuffer(decodedAudioBuffer);
                    setDuration(decodedAudioData.duration);
                    break;
                case 'mp3':
                case 'aac':
                case 'ogg':
                    setMusicFormat(format.toLowerCase());
                    const response = await fetch(URL.createObjectURL(file));
                    const arrayBuffer = await response.arrayBuffer();
                    decodedAudioData = await new2AudioContext.decodeAudioData(arrayBuffer);
                    setAudioData(decodedAudioData);
                    decodedAudioBuffer = (decodedAudioData);
                    setAudioBuffer(decodedAudioBuffer);
                    setDuration(decodedAudioData.duration);
                    break;
                default:
                    alert('Unsupported file format, we only support wav, mp3, aac, ogg');
                    setAudioData(null);
                    setAudioSource(null);
                    setAudioContext(null);
                    setMusicFormat(null);
                    return;
            }
            if (audioSource !== null) {
                audioSource.stop();
            }
            new2AudioContext.close();

            setIsPlayingMusic(true);

            // play a new audio
            setCurrentTime(0);
            setOffset(0);
            let new3AudioContext;
            if (audioContext === null || audioContext.state === "closed") new3AudioContext = new AudioContext();
            else new3AudioContext = audioContext;

            // set analyser
            const analyser = new3AudioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.connect(new3AudioContext.destination);
            setAnalyser(analyser);

            // set volume
            const gainNode = new3AudioContext.createGain();
            gainNode.gain.value = volumeLevel;
            gainNode.connect(analyser);

            if (musicFormat === 'wav') {
                for (let channel = 0; channel < decodedAudioData.numChannels; channel++) {
                    const channelData = decodedAudioBuffer.getChannelData(channel);
                    for (let i = 0; i < decodedAudioData.decodedAudioData.length; i += decodedAudioData.numChannels) {
                        channelData[i / decodedAudioData.numChannels] = decodedAudioData.decodedAudioData[i + channel];
                    }
                }
            }
            const sourceNode = new3AudioContext.createBufferSource();
            sourceNode.buffer = decodedAudioBuffer;
            sourceNode.connect(gainNode);
            sourceNode.start();
            setAudioSource(sourceNode);
            setAudioContext(new3AudioContext);
        };

        const handleEnd = () => {
            setIsPlayingMusic(false);
            setCurrentTime(0);

            switch (playMode) {
                case 'single':
                    audioSource.stop();
                    break;
                case 'loop':
                    loadAndPlayMusic(currentMusic.audioTitle);
                    break;
                case 'random':
                    const randomIndex = Math.floor(Math.random() * musicList.length);
                    const randomMusic = musicList[randomIndex];
                    loadAndPlayMusic(randomMusic.audioTitle);
                    break;
                default:
                    break;
            }
        };

        audioSource.addEventListener('ended', handleEnd);
        return () => audioSource.removeEventListener('ended', handleEnd);
    }, [audioContext, audioData, audioSource, currentMusic, musicFormat, playMode, volumeLevel]);



    return (
        <div id="audioPlayer">
            <div className="container">
                <div className="row align-items-center">
                    {/* Top left block: Cover photo and visualizer. */}
                    <section className=" col-lg-7 col-md-12 p-1 p-lg-5" id='topLeft'>
                        <div className="d-flex flex-column align-items-center">
                            <MusicVisualizer class="mx-auto d-block" audioContext={audioContext} analyser={analyser} width={450} height={50} />

                            {currentMusic !== null && currentMusic.coverPhotoPath !== '' && currentMusic.coverPhotoPath !== undefined &&
                                <img src={currentMusic.coverPhotoPath} alt="coverPhoto" style={{ width: "450px", height: "450px" }}></img>
                            }
                        </div>
                    </section>


                    {/* Top right block: Lyrics. */}
                    <section className="col-lg-5 col-md-12 p-1 p-lg-5" id='topRight'>
                        <div className="d-flex flex-column align-items-center">
                            {currentMusic !== null && <LrcDisplayer music={currentMusic} currentTime={currentTime} />}
                        </div>
                    </section>
                </div>

                <div className="row flex-grow-1">
                    {/* Upper bottom: Song list and uploding. */}
                    <div className="col-md-12" id='upperBottom'>
                        <div id="songList">
                            <h3>Select Music from database
                                {musicList.map((music, index) => {
                                    return (
                                        <div key={index}>
                                            <button onClick={() => { loadMusic(music.audioTitle) }}>{music.audioTitle}</button>
                                        </div>
                                    )
                                }
                                )}
                            </h3>
                        </div>
                        <div id="selectMusic">
                            <h3>Select music from your computer <input type="file" onChange={handleFileChange} /> </h3>
                        </div>

                    </div>
                </div>

                <div className="row">
                    {/* Bottom block: Audio information and control. */}
                    <div className="col-md-12" id='bottom'>
                        <h2>{currentMusic === null ? fileName : currentMusic.audioTitle}</h2>
                        <p>Artist: {currentMusic === null ? "unknown" : currentMusic.artist}</p>
                        <p>Album: {currentMusic === null ? "unknown" : currentMusic.album}</p>


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
                        <button id="single" onClick={() => { setPlayMode('single') }} disabled={playMode === 'single'}>Single</button>
                        <button id="loop" onClick={() => { setPlayMode('loop') }} disabled={playMode === 'loop'}>Loop</button>
                        <button id="random" onClick={() => { setPlayMode('random') }} disabled={playMode === 'random'}>Random</button>
                        {" " + playMode}
                        <div>
                            <input
                                type="range"
                                id="progressBar"
                                min="0"
                                max={audioData ? audioData.duration : 0}
                                step="0.01"
                                style={{ width: "300px" }}
                                onChange={setProgressBar}
                            >
                            </input>
                            {numberToTime(currentTime)} / {numberToTime(duration)}
                        </div>
                    </div>
                </div>
            </div>






            {/* Debug: Audio data. */}
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