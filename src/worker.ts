// @ts-ignore
import { decode } from "node-wav";
// @ts-ignore
import recorder from "node-record-lpcm16";
// @ts-ignore
import wavHeaders from "wav-headers";
import { Whisper } from "smart-whisper";
import downloadModel from "./download_model.js";

import { homedir } from "node:os";
import { join } from "node:path";
import { exit } from "node:process";
import readline from "node:readline";

async function main() {
  const homeDir = homedir();
  const directoryName = ".aivox/models";
  const fullPath = join(homeDir, directoryName);
  const dl = downloadModel(fullPath);
  const model = join(fullPath, "ggml-base.en.bin");

  const recording = recorder.record({
    sampleRate: 16000,
    channels: 1,
    encoding: "pcm16",
  });

  const chunks: Buffer[] = [];
  recording.stream().on("data", (chunk: Buffer) => chunks.push(chunk));

  // Set up readline
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  let recordingFinished = false;

  // Function to stop recording and process audio
  const stopRecordingAndProcess = async () => {
    if (recordingFinished) return;
    recordingFinished = true;

    recording.stop();
    const rawData = Buffer.concat(chunks);

    // Check if there's enough audio data (e.g., at least 0.5 seconds)
    if (rawData.length < 16000) {  // 16000 samples per second, so this is 0.5 seconds
      console.log("Not enough audio data recorded. Please try again and speak for a longer duration.");
      exit(0);
    }

    const header = wavHeaders({
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      dataLength: rawData.length,
    });
    const wavFile = Buffer.concat([header, rawData]);

    try {
      await dl;
      const whisper = new Whisper(model, { gpu: true });
      const pcm = readWavFromBuffer(wavFile);
      const task = await whisper.transcribe(pcm, {
        language: "en",
        print_special: false,
        print_progress: false,
        print_realtime: false,
        print_timestamps: false,
      });
      const result = await task.result;
      if (result && result.length > 0 && result[0].text) {
        console.log(result[0].text);
      } else {
        console.log("No transcription result. The audio might be too short or silent.");
      }
      await whisper.free();
      exit(0);
    } catch (error) {
      console.error("Error during transcription:", error);
      exit(1);
    }
  };

  // Set timeout
  const timeoutId = setTimeout(stopRecordingAndProcess, 5000);

  // Listen for keypress
  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'space' || (key.ctrl && key.name === 'c')) {
      clearTimeout(timeoutId);
      stopRecordingAndProcess();
    }
  });
}

function readWavFromBuffer(buffer: Buffer): Float32Array {
  const { sampleRate, channelData } = decode(buffer);
  if (sampleRate !== 16000) {
    throw new Error(`Invalid sample rate: ${sampleRate}`);
  }
  if (channelData.length !== 1) {
    throw new Error(`Invalid channel count: ${channelData.length}`);
  }
  return channelData[0];
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});