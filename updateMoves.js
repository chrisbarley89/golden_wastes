const { exec } = require('child_process');

// Function to run a script with arguments
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const command = `node ${scriptPath} ${args.join(' ')}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${scriptPath}: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`stderr from ${scriptPath}: ${stderr}`);
        return;
      }
      console.log(`${scriptPath}: \n${stdout}`);
      resolve();
    });
  });
}

// Check if the required argument is passed from the command line
const parseArgument = process.argv[2]; // The argument for parse.js (e.g., "json" or "md")

// Check if the argument is provided
if (!parseArgument) {
  console.error('Usage: node run-scripts.js <json|md>');
  process.exit(1); // Exit the script if no argument is provided
}

// Define the arguments for parse.js
const parseArgs = [parseArgument];

// Run compare.js only if the argument is "json"
if (parseArgument === "json") {
  runScript('scripts/parse.js', parseArgs)
    .then(() => {
      // After compare.js finishes, run parse.js with the argument provided in the command line
      return runScript('scripts/compare.js');
    })
    .then(() => {
      // After parse.js finishes, run bookGenerator.js
      return runScript('scripts/bookGenerator.js');
    })
    .then(() => {
      console.log('All scripts executed successfully.');
    })
    .catch((err) => {
      console.error('An error occurred:', err);
    });
} else {
  // If the argument is not "json", run parse.js directly and then bookGenerator.js
  runScript('scripts/parse.js', parseArgs)
    .then(() => {
      // After parse.js finishes, run bookGenerator.js
      return runScript('scripts/bookGenerator.js');
    })
    .then(() => {
      console.log('All scripts executed successfully.');
    })
    .catch((err) => {
      console.error('An error occurred:', err);
    });
}
