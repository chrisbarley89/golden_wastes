const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Define the source and destination file paths
const sourcePath = './local/templates/GoldenWastes.docx';
const destinationPath = './local/GoldenWastes.docx';

// Copy the file, replacing it if it already exists
fs.copyFile(sourcePath, destinationPath, (err) => {
  if (err) {
    console.error('Error copying file:', err);
    return;
  }
  
  console.log('File copied successfully!');
  
  // Run the Python script after the file is copied
  exec('python3 ./scripts/bookGenerator.py', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
      return;
    }
    console.log(`Python script output: ${stdout}`);
  });
});
