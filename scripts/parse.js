// Import required modules
const fs = require('fs');
const path = require('path');

// Configurable constants for Markdown formatting
const CLASS_TITLE_PREFIX = '##';
const TYPE_TITLE_PREFIX = '###';
const MOVE_NAME_PREFIX = '####';

// Input and output file paths
const inputFilePath = './data/moves.json';
const outputFilePath = './local/book-generated.md';

// Function to clean and format description text
function formatDescription(description) {
  // Remove the "✴" symbol
  let formattedDescription = description.replace(/✴/g, '');

  // Define patterns for specific lines with exact formatting
  const patterns = [
    { match: 'On a 10+', replacement: '✴ On a 10+' },  // Fix for double ++ issue
    { match: 'On a 7–9', replacement: '✴ On a 7–9' },  // Added "On a 7-9"
    { match: 'On a 6-', replacement: '✴ On a 6-' }
  ];

  // For each pattern, insert the formatted bullet point and "✴"
  patterns.forEach(({ match, replacement }) => {
    const regex = new RegExp(`(${match})`, 'g');
    formattedDescription = formattedDescription.replace(regex, `\n- ${replacement}`);
  });

  // Return the formatted description
  return formattedDescription;
}

// Function to generate Markdown content
function generateMarkdownContent(moves) {
  const groupedData = {};

  // Group moves by class and then by type, sorting by name within each group
  moves.forEach(move => {
    const classKey = move.class || 'No Class';
    const typeKey = move.type || 'Basic';

    if (!groupedData[classKey]) groupedData[classKey] = {};
    if (!groupedData[classKey][typeKey]) groupedData[classKey][typeKey] = [];

    groupedData[classKey][typeKey].push(move);
  });

  // Sort entries alphabetically by name within each class/type
  Object.keys(groupedData).forEach(classKey => {
    Object.keys(groupedData[classKey]).forEach(typeKey => {
      groupedData[classKey][typeKey].sort((a, b) => a.name.localeCompare(b.name));
    });
  });

  // Build Markdown content string
  let markdownContent = '';
  for (const [classKey, types] of Object.entries(groupedData)) {
    // Add class title with a single empty line before
    markdownContent += `\n${CLASS_TITLE_PREFIX} ${classKey}\n`;

    for (const [typeKey, moves] of Object.entries(types)) {
      // Add type title with a single empty line before
      markdownContent += `\n${TYPE_TITLE_PREFIX} ${typeKey}\n`;

      for (const move of moves) {
        // Add move name as the title with a single empty line before
        markdownContent += `\n${MOVE_NAME_PREFIX} ${move.name}\n`;
        markdownContent += `${formatDescription(move.description)}\n`;
      }
    }
  }

  return markdownContent;
}

// Main function to read the JSON file, process it, and write the Markdown file
function generateMarkdownFile() {
  try {
    // Read the JSON data
    const data = fs.readFileSync(inputFilePath, 'utf-8');
    const moves = JSON.parse(data);

    // Generate the Markdown content
    const markdownContent = generateMarkdownContent(moves);

    // Write the content to the output Markdown file
    fs.writeFileSync(outputFilePath, markdownContent, 'utf-8');
    console.log(`Markdown file generated successfully at ${outputFilePath}`);
  } catch (error) {
    console.error('Error generating Markdown file:', error);
  }
}

// Execute the script
generateMarkdownFile();
