#!/usr/bin/env nodek
import { spawn } from 'child_process';
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

(async () => {
    try {
        const result = await runTranscription();
        console.log(result.trim());
    } catch (error) {
        console.error('Error:', error);
    }
})();