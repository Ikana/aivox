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

async function main() {


  // Get the user's home directory
  const homeDir = homedir();

  // Define the directory you want inside the user's home directory
  const directoryName = ".aivox/models";

  // Construct the full path to the directory
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

  // Stop recording after three seconds
  setTimeout(async () => {
    const rawData = Buffer.concat(chunks);

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
      console.log(result[0].text);

      await whisper.free();

      exit(0);
    } catch (error) {
      console.error("Error during transcription:", error);
    }
  }, 5000);

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