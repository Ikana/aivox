const message = 'Recording: ';
const spinnerFrames = [
    '⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'
];
let currentIndex = 0;
let frameIndex = 0;
let printedExit = false;

function typeMessage() {
    if (currentIndex < message.length) {
        process.stderr.write(message[currentIndex]);
        currentIndex++;
    } else {
        if (!printedExit) {
            process.stderr.write('press space to stop recording \t');
            printedExit = true;
        }
        process.stderr.write('\b' + spinnerFrames[frameIndex]);
        frameIndex = (frameIndex + 1) % spinnerFrames.length;
    }
}

const intervalId = setInterval(typeMessage, 100); // Adjust the interval as needed

process.on('message', (msg) => {
    if (msg === 'exit') {
        process.stderr.write('\n');
        clearInterval(intervalId);

        process.exit();
    }
});

// Keep the process alive
setInterval(() => {}, 1000);
