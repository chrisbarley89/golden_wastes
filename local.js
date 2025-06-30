const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const publicDir = path.join(__dirname, 'public');
const localDir = path.join(__dirname, 'local');
const atlasDir = path.join(localDir, 'Atlas');
const hugoReplacement = `github.com/jack-hk/Atlas -> ${atlasDir.replace(/\\/g, '/')}`;

// Cleanup public folder
try {
    if (fs.existsSync(publicDir)) {
        fs.rmSync(publicDir, { recursive: true, force: true });
        console.log(`✅ Deleted: ${publicDir}`);
    } else {
        console.log(`ℹ️  Directory does not exist: ${publicDir}`);
    }
} catch (err) {
    console.error(`❌ Failed to delete public dir:`, err);
}

// Ensure local/Atlas exists
if (!fs.existsSync(atlasDir)) {
    console.error(`❌ Theme not found: ${atlasDir}`);
    process.exit(1);
}

console.log(`✅ Using local theme: ${atlasDir}`);
console.log(`🔧 HUGO_MODULE_REPLACEMENTS: ${hugoReplacement}`);

// Launch Hugo with full env passed in
const hugoProcess = spawn('hugo', ['server'], {
    shell: true,
    env: {
        ...process.env,
        HUGO_MODULE_REPLACEMENTS: hugoReplacement,
        PATH: process.env.PATH // ensure hugo is found
    }
});

hugoProcess.stdout.on('data', (data) => {
    process.stdout.write(`stdout: ${data}`);
});

hugoProcess.stderr.on('data', (data) => {
    process.stderr.write(`stderr: ${data}`);
});

hugoProcess.on('close', (code) => {
    console.log(`🚪 Hugo exited with code ${code}`);
});
