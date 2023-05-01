import React, { useEffect, useState, useCallback } from 'react';
import { DecodeWav } from './WavDecoder';
import MusicVisualizer from './MusicVisualizer';
import LrcDisplayer from './LrcDisplayer';
import musicList from '../MusicDatabase/musicList';
import io from 'socket.io-client';
import "../index.css"

const socket = io.connect("http://localhost:3001");

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
    const [searchKeywords, setSearch] = useState('');
    const handleSearchChange = (event) => {setSearch(event.target.value);};
    const [title, setTitle] = useState('unknown'); // for title
    const handleTitleChange = (event) => {setTitle(event.target.value);};
    const [artist, setArtist] = useState('unknown'); // for artist
    const handleArtistChange = (event) => {setArtist(event.target.value);};
    const [album, setAlbum] = useState('unknown'); // for album
    const handleAlbumChange = (event) => {setAlbum(event.target.value);};
    const [coverFile, setCoverFile] = useState(null); // for cover

    //networking
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

    const handleCoverFileChange = (event) => {
        const file = event.target.files[0];
        const format = file.name.substr(file.name.length - 3);
        if (format !== 'jpg' && format !== 'JPG' && format !== 'png' && format !== 'PNG') {
            if (file.name.substr(file.name.length - 4) !== 'jpeg' && file.name.substr(file.name.length - 4) !== 'JPEG') {
                alert('Please upload a jpg or png file');
                return;
            }
        }
        const fpath = URL.createObjectURL(file);
        setCoverFile(fpath);
    };
    const [lyricsFile, setLyricsFile] = useState(null); // for lyrics
    const handleLyricsFileChange = (event) => {
        const file = event.target.files[0];
        const format = file.name.substr(file.name.length - 3);
        if (format !== 'txt' && format !== 'lrc') {
            alert('Please upload a txt or lrc file');
            return;
        }
        var fpath = URL.createObjectURL(file);

        fpath = fpath.concat("."+format);

        setLyricsFile(fpath);
    };
    const [musicFile, setMusicFile] = useState(null); // for music file
    const handleMusicFileChange = (event) => {
        const file = event.target.files[0];
        const format = file.name.substr(file.name.length - 3);
        if (format !== 'wav' && format !== 'mp3' && format !== 'ogg' && 'aac') {
            alert('Please upload a wav, mp3, ogg or aac file');
            return;
        }
        const fpath = URL.createObjectURL(file);
        setMusicFile(fpath);
    };

    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState({}), []); // force rerender

    // Add music to database
    const addMusic = useCallback (() => {

        if (musicFile === null) { alert ("please upload a music"); return; }

        if (title === null) { setTitle('unknown'); }
        if (artist === null) { setArtist('unknown'); }
        if (album === null) { setAlbum('unknown'); }
        if (coverFile === null) { setCoverFile(''); }
        if (lyricsFile === null) { setLyricsFile(''); }
        if (musicFile === null) { setMusicFile(''); }
    
        musicList.push(
            {
                "audioPath": musicFile,
                "audioTitle": title,
                "artist": artist,
                "album": album,
                "coverPhotoPath": coverFile,
                "lyricsPath": lyricsFile
            }
        );

        forceUpdate();

        setTitle('unknown');
        setArtist('unknown');
        setAlbum('unknown');
        setCoverFile(null);
        setLyricsFile(null);
        setMusicFile(null);
    },[forceUpdate, title, artist, album, coverFile, lyricsFile, musicFile]);

    // delete music from database
    const deleteMusic = useCallback ((name) => {
        musicList.splice(musicList.findIndex(obj => obj.audioTitle === name), 1);
        forceUpdate();
    },[forceUpdate]);


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
            default:
                setMusicFormat(format.toLowerCase());
                const response = await fetch(URL.createObjectURL(file));
                const arrayBuffer = await response.arrayBuffer();
                const decodedAudioData = await newAudioContext.decodeAudioData(arrayBuffer);
                setAudioData(decodedAudioData);
                setAudioBuffer(decodedAudioData);
                setDuration(decodedAudioData.duration);
                break;
        }
        if (audioSource !== null) {
            audioSource.stop();
        }
        newAudioContext.close();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        const format = file.name.substr(file.name.length - 3);
        if (format !== 'wav' && format !== 'mp3' && format !== 'ogg' && 'aac') {
            alert('Please upload a wav, mp3, ogg or aac file');
            return;
        }
        var isMusicExist = false;
        musicList.map((music) => {
            if (music.audioTitle === file.name.substr(0, file.name.length-4)) {
                isMusicExist = true;
                alert('This music is already in the database');
            }
        })
        const fpath = URL.createObjectURL(file);
        setMusicFile(fpath);
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
            // console.log('volumeLevel: ', volumeLevel);
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

    // Load and Play
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
            default:
                setMusicFormat(format.toLowerCase());
                const response = await fetch(URL.createObjectURL(file));
                const arrayBuffer = await response.arrayBuffer();
                decodedAudioData = await new2AudioContext.decodeAudioData(arrayBuffer);
                setAudioData(decodedAudioData);
                decodedAudioBuffer = (decodedAudioData);
                setAudioBuffer(decodedAudioBuffer);
                setDuration(decodedAudioData.duration);
                break;
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

    // handle PlayMode
    useEffect(() => {
        if (audioContext === null) return;
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
                            <h3> 
                                Search
                            </h3>
                            <input type="text" placeholder="Keywords" style={{color:"black", width: "200px"}} onChange={handleSearchChange} />
                        <div style={{ minHeight: '200px', maxHeight: '400px', maxWidth: '1000px', overflow: 'auto' }}>
                            {musicList.map((music) => {
                                if (music.audioTitle.toLowerCase().includes(searchKeywords.toLowerCase(), 0) || music.artist.toLowerCase().includes(searchKeywords.toLowerCase(), 0) || music.album.toLowerCase().includes(searchKeywords.toLowerCase(), 0)) {
                                    return (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridGap: 20, color: "white" }}>
                                            <div>
                                                <button style={{background: "lightgreen"}} onClick={() => { loadAndPlayMusic(music.audioTitle) }}>play</button>
                                                <button style={{background: "pink"}} onClick={() => { deleteMusic(music.audioTitle) }}>delete</button>
                                                {music.audioTitle}
                                            </div>
                                            <div>{music.artist}</div>
                                            <div>{music.album}</div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        <div id="selectMusic" style={{marginTop: "20px"}}>
                        
                            <h3>
                                Add music from your computer 
                            </h3>
                            <input type="text" placeholder="Title" style={{color:"black", width: "200px"}} onChange={handleTitleChange} />
                            <input type="text" placeholder="Artist" style={{color:"black", width: "200px"}} onChange={handleArtistChange}/>
                            <input type="text" placeholder="Album" style={{color:"black", width: "200px"}} onChange={handleAlbumChange}/>
                            <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", margin:"5px"}}>
                                <>
                                    <p style={{margin: "4px"}}>Cover</p>
                                    {/* <label for="coverFile" style={{background:"white", marginLeft:"5px", marginRight:"5px"}}>Select Cover</label> */}
                                    <input id="coverFile" type="file" style={{color:"grey"}} onChange={handleCoverFileChange} />
                                </>
                                <>
                                    <p style={{margin: "4px"}}>Lyrics</p>
                                    {/* <label for="lyricsFile" style={{background:"white", marginLeft:"5px", marginRight:"5px"}}>Select Lyrics</label> */}
                                    <input id="lyricsFile" type="file" style={{color:"grey"}} onChange={handleLyricsFileChange} />
                                </>
                                <>
                                    <p style={{margin: "4px"}}>Music</p>
                                    {/* <label for="musicFile" style={{background:"white", marginLeft:"5px", marginRight:"5px"}}>Select Music</label> */}
                                    <input id="musicFile" type="file" style={{color:"grey"}} onChange={handleMusicFileChange} />
                                </>
                            </div>
                            <button style={{background:"lightblue"}} onClick={addMusic}>Upload</button>
                        </div>

                    </div>
                </div>
                
                <div className="row" style={{marginTop:"20px"}}>
                    {/* Bottom block: Audio information and control. */}
                    <div className="col-md-12" id='bottom'>
                        <h2 style={{color: 'white'}}>{currentMusic === null ? fileName : currentMusic.audioTitle}</h2>
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
                        <div>
                            <input
                                type="range"
                                id="progressBar"
                                min="0"
                                max={audioData ? audioData.duration : 0}
                                step="0.01"
                                style={{ width: "300px", height:"40px" }}
                                onChange={setProgressBar}
                            >
                            </input>
                            <p style={{color:"white"}}>{numberToTime(currentTime)} / {numberToTime(duration)}</p>
                        </div>
                    </div>
                </div>
                <div style={{height:"250px"}}>
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
                </div>
            </div>
            





            {/* Debug: Audio data. */}
            {/* {
                audioData && (
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
                )
            } */}
        </div >
    );
}