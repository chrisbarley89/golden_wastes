const { exec } = require('child_process');
const path = require('path');

// Define the absolute paths for the scripts to run
const movesIndexGeneratorPath = path.join(__dirname, './scripts/movesIndexGenerator.js');
const movesPageGeneratorPath = path.join(__dirname, './scripts/movesPageGenerator.js');

// Function to run a script with error handling
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    exec(`node ${scriptPath}`, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptPath}:`, error);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr from ${scriptPath}:`, stderr);
        return reject(stderr);
      }
      console.log(`Output from ${scriptPath}:`, stdout);
      resolve(stdout);
    });
  });
}

// Run the scripts sequentially
async function runGenerators() {
  try {
    console.log('Running movesIndexGenerator.js...');
    await runScript(movesIndexGeneratorPath);

    console.log('Running movesPageGenerator.js...');
    await runScript(movesPageGeneratorPath);

    console.log('Both scripts executed successfully!');
  } catch (error) {
    console.error('An error occurred while running the scripts:', error);
  }
}

runGenerators();
