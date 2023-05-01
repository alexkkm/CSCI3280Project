// Decode a WAV audio file into an object containing its properties and audio data, with optional volume modification
export const DecodeWav = async (file, volume = 1) => {

  // Create a promise to handle asynchronous code
  return new Promise((resolve, reject) => {

    const fileReader = new FileReader();

    // Set an onload function to handle the file once it has been loaded
    fileReader.onload = () => {

      // Get the raw binary data of the audio file
      const audioArrayBuffer = fileReader.result;

      // Create a new data view object to interpret the binary data
      const audioDataView = new DataView(audioArrayBuffer);

      // Extract properties from the data view object
      const format = audioDataView.getUint16(20, true);
      const numChannels = audioDataView.getUint16(22, true);
      const sampleRate = audioDataView.getUint32(24, true);
      const byteRate = audioDataView.getUint32(28, true);
      const blockAlign = audioDataView.getUint16(32, true);
      const bitDepth = audioDataView.getUint16(34, true);

      // Define the offset and length of the audio data
      const dataOffset = 44;
      const dataLength = audioArrayBuffer.byteLength - dataOffset;

      const duration = dataLength / byteRate;

      // Create a new Float32Array to store the audio data
      const audioData = new Float32Array(dataLength / 2);

      // Extract the audio data from the binary data and convert it to a float between -1 and 1, with optional volume modification
      for (let i = 0; i < dataLength; i += 2) {
        audioData[i / 2] = (audioDataView.getInt16(i + dataOffset, true) / 32767) * volume; // 32767 is the maximum value for a 16-bit integer
      }

      // Resolve the promise with an object containing the audio file properties and data
      resolve({ format, numChannels, sampleRate, byteRate, blockAlign, bitDepth, audioData, duration });
    };

    // Set an onerror function to reject the promise if an error occurs
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
};
