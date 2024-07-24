#!/usr/bin/env node
import { spawn, fork } from 'child_process';
import * as path from 'path';

async function runTranscription(): Promise<string> {
    return new Promise((resolve, reject) => {
        const workerScript = path.resolve(__dirname, 'worker.js');
        const child = spawn('node', [workerScript], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let result = '';
        child.stdout.on('data', (data) => {
            result += data.toString();
        });

        child.stderr.on('data', (data) => {
            // Suppress the C++ logs
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(result);
            } else {
                reject(new Error(`Worker process exited with code ${code}`));
            }
        });
    });
}

function showRecordingMessage() {
    const messageProcess = fork(path.resolve(__dirname, 'recording.js'), {
        stdio: ['ignore', 'ignore', 'inherit', 'ipc'] // Use IPC channel and inherit stderr
    });
    return messageProcess;
}

(async () => {
    const recordingProcess = showRecordingMessage();
    try {
        const result = await runTranscription();
        recordingProcess.send('exit'); // Signal the recording message to exit
        recordingProcess.on('exit', () => {
            console.log(result.trim());
        });
    } catch (error) {
        recordingProcess.send('exit'); // Ensure the message process is stopped on error
        recordingProcess.on('exit', () => {
            console.error('Error:', error);
        });
    }
})();
