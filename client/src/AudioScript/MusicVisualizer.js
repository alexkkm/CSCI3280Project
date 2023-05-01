import React, { useRef, useEffect } from "react";

const MusicVisualizer = ({ audioContext, analyser, width, height }) => {

    const canvasRef = useRef(null);

    useEffect(() => {
        // Get the canvas element and its context
        const canvas = canvasRef.current;
        const canvasContext = canvas.getContext("2d");

        if (analyser !== null ) {
        // Create a new array to hold the frequency data
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Define a function to render a frame
        const renderFrame = () => {
            // Request the next animation frame
            requestAnimationFrame(renderFrame);

            // Clear the canvas
            canvasContext.clearRect(0, 0, width, height);

            // Get the frequency data from the analyser
            analyser.getByteFrequencyData(dataArray);

            canvasContext.fillStyle = "rgba(0, 0, 0, 0)"; // background color
            canvasContext.fillRect(0, 0, width, height);

            // Calculate the width of each bar based on the canvas width and number of frequency bins
            const barWidth = (width / dataArray.length) * 2.5;
            
            // heightFactor is used to scale the height of the bars, if canvas is short, factor should be higher
            const heightFactor = 1; // 1 means no scaling, 2 means double the height 0.5 means half height, etc.
            let barHeight;
            let x = 0;

            // Loop through the frequency data and draw a bar for each frequency bin
            for (let i = 0; i < dataArray.length; i++) {

            barHeight = dataArray[i] / 127 * height * heightFactor;


            canvasContext.fillStyle = `rgb(${barHeight + 100}, 0, 0)`; // create a fade out effect for red channel


            canvasContext.fillRect(x, height - barHeight / 2, barWidth, barHeight);

            x += barWidth + 1; // Move the position to the next bar
            }
        };
        
        renderFrame();
        }

    }, [audioContext, analyser, width, height]);

    return <canvas ref={canvasRef} width={width} height={height} />;
};

export default MusicVisualizer;
