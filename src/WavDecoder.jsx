export const DecodeWav = async (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const audioArrayBuffer = fileReader.result;
        const audioDataView = new DataView(audioArrayBuffer);
        const format = audioDataView.getUint16(20, true);
        const numChannels = audioDataView.getUint16(22, true);
        const sampleRate = audioDataView.getUint32(24, true);
        const byteRate = audioDataView.getUint32(28, true);
        const blockAlign = audioDataView.getUint16(32, true);
        const bitDepth = audioDataView.getUint16(34, true);
        const dataOffset = 44;
        const dataLength = audioArrayBuffer.byteLength - dataOffset;
        const audioData = new Float32Array(dataLength / 2);
        for (let i = 0; i < dataLength; i += 2) {
          audioData[i / 2] = audioDataView.getInt16(i + dataOffset, true) / 32767;
        }
        resolve({ format, numChannels, sampleRate, byteRate, blockAlign, bitDepth, audioData });
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };
  
  export const ClearAudioData = () => {
    console.log("ClearAudioData");
    return { format: 0, numChannels: 0, sampleRate: 0, byteRate: 0, blockAlign: 0, bitDepth: 0, audioData: null };
  };