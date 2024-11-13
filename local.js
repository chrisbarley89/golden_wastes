const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Define the directory for "public" and "local"
const publicDir = path.join(__dirname, 'public');
const localDir = path.join(__dirname, 'local');

// Create the "local" directory if it doesn't exist
if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir);
    console.log(`Created directory: ${localDir}`);
} else {
    console.log(`Directory already exists: ${localDir}`);
}

// Check if the "public" directory exists and remove it if so
if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
    console.log(`Successfully deleted ${publicDir}`);
} else {
    console.log(`The directory ${publicDir} does not exist.`);
}

// Set environment variable for Hugo
process.env.HUGO_MODULE_REPLACEMENTS = `github.com/jack-hk/Atlas -> ${localDir}\\Atlas`;

// Run hugo server using spawn
const hugoProcess = spawn('hugo', ['server']);

// Handle standard output
hugoProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

// Handle standard error output
hugoProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

// Handle the process exit
hugoProcess.on('close', (code) => {
    console.log(`Hugo process exited with code ${code}`);
});
