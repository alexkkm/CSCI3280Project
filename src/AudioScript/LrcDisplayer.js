import React, { useState, useEffect } from 'react';

function LrcDisplayer({ music, currentTime }) {

  const lyricsTextFilePath = music.lyricsPath;

  const [lyrics, setLyrics] = useState([]);
  const [currentLyricsIndex, setCurrentLyricsIndex] = useState(-1);

  useEffect(() => {
    if (lyricsTextFilePath === undefined || lyricsTextFilePath === null || lyricsTextFilePath === '') {
      return;
    }
    // fetch lyrics text file and parse it
    if (lyricsTextFilePath.substring(lyricsTextFilePath.length - 4) === '.txt') {
      // fetch lyrics text file and set as lyrics state variable
      fetch(lyricsTextFilePath)
        .then(response => response.text())
        .then(text => setLyrics([{ time: 0, text }]));
    }
    else { // lrc file
      fetch(lyricsTextFilePath)
        .then(response => response.text())
        .then(text => {
          const dummyStart = ['[00:00.00].\n', '[00:00.00]... \n'];
          const dummyEnd = ['[99:99.99]... \n', '[99:99.99]. '];
          const lyricsArray = dummyStart.concat(text.split('\n')).concat(dummyEnd);
          const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
          const parsedLyrics = lyricsArray.reduce((acc, line) => {

            const match = line.match(regex);
            if (match) {
              const minutes = parseInt(match[1], 10);
              const seconds = parseInt(match[2], 10);
              const milliseconds = parseInt(match[3], 10);
              let text = match[4];
              const time = minutes * 60 + seconds + milliseconds / 1000;
              acc.push({ time, text });
            }
            return acc;
          }, []);
          setLyrics(parsedLyrics);
        });
    }
  }, [lyricsTextFilePath]);

  useEffect(() => {
    if (lyricsTextFilePath === undefined || lyricsTextFilePath === null || lyricsTextFilePath === '') {
      return;
    }
    if (lyricsTextFilePath.substring(lyricsTextFilePath.length - 4) === '.txt') {
      return;
    }
    // find the current lyrics based on the current time
    const currentLyricsIndex = lyrics.findIndex((l, i) => {
      const nextLyricsTime = lyrics[i + 1] ? lyrics[i + 1].time : Infinity;
      return l.time <= currentTime && nextLyricsTime > currentTime;
    });
    setCurrentLyricsIndex(currentLyricsIndex);
  }, [lyrics, currentTime, lyricsTextFilePath]);

  const getLyricsToDisplay = () => {
    if (lyricsTextFilePath === undefined || lyricsTextFilePath === null || lyricsTextFilePath === '') {
      return [];
    }
    if (lyricsTextFilePath.substring(lyricsTextFilePath.length - 4) === '.txt') {
      return lyrics;
    }

    if (lyrics.length === 0) {
      return [];
    }

    if (lyrics.length <= 5) {
      return lyrics;
    }

    if (currentLyricsIndex === -1 || currentLyricsIndex < 2) {
      // show first 5 lyrics if currentLyrics is not found or it's within the first 2 lyrics
      return lyrics.slice(0, 5);
    }

    if (currentLyricsIndex >= lyrics.length - 2) {
      // show last 5 lyrics if currentLyrics is within the last 2 lyrics
      return lyrics.slice(lyrics.length - 5, lyrics.length);
    }

    // show 2 lyrics before, currentLyrics, and 2 lyrics after
    return lyrics.slice(currentLyricsIndex - 2, currentLyricsIndex + 3);
  };

  const lyricsToDisplay = getLyricsToDisplay();

  return (
    <div style={{ maxHeight: '400px', maxWidth: '400px', overflow: 'auto' }}>
      {lyricsToDisplay.map((lyric, index) => (
        <p key={index} style={lyricsTextFilePath.substring(lyricsTextFilePath.length - 4) === '.txt' ?
          { textAlign: 'center', whiteSpace: 'pre-wrap' } :
          { textAlign: 'center', fontWeight: currentLyricsIndex === lyrics.indexOf(lyric) ? 'bold' : 'normal' }}>
          {lyric.text}
        </p>
      ))}
    </div>
  );
}

export default LrcDisplayer;