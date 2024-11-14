const fs = require('fs');
const path = require('path');

// Define file paths
const JSON_FILE_PATH = './data/moves.json';
const BACKUP_JSON_FILE_PATH = './local/moves-old.json';
const MD_FILE_PATH = './local/moves.md';

// Configuration
const iconSize = "20";

// Load JSON data
function loadJsonData() {
  return JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf-8'));
}

// Save data as JSON
function saveAsJson(data) {
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`JSON file saved to ${JSON_FILE_PATH}`);
}

// Save data as Markdown
function saveAsMarkdown(data) {
  let mdContent = '';
  let currentClass = null;
  let currentType = null;

  data.forEach((entry) => {
    if (entry.class && entry.class !== currentClass) {
      mdContent += `# ${entry.class}\n\n`;
      currentClass = entry.class;
    }

    if (entry.type && entry.type !== currentType) {
      mdContent += `## ${entry.type}\n\n`;
      currentType = entry.type;
    }

    mdContent += `**${entry.name}**\n\n`;
    mdContent += `{${entry.description}}\n\n`;

    if (entry.required) mdContent += `Required: ${entry.required}\n\n`;
    if (entry.replaces) mdContent += `Replaces: ${entry.replaces}\n\n`;

    if (entry.icon) {
      const iconUrl = `https://seiyria.com/gameicons-font/svg/${entry.icon}.svg`;
      mdContent += `Icon: <img src="${iconUrl}" width="${iconSize}"/>\n\n`; // Removed alt
    }
  });

  fs.writeFileSync(MD_FILE_PATH, mdContent.trim(), 'utf-8');
  console.log(`Markdown file saved to ${MD_FILE_PATH}`);
}

// Convert Markdown back to JSON
function markdownToJson(mdContent) {
  const lines = mdContent.split('\n');
  const result = [];
  let currentEntry = {};
  let currentClass = null;
  let currentType = null;
  let descriptionBuffer = '';
  let isInsideDescription = false;

  lines.forEach((line) => {
    line = line.trim();

    if (line.startsWith('# ')) {
      currentClass = line.replace('# ', '').trim();
    } else if (line.startsWith('## ')) {
      currentType = line.replace('## ', '').trim();
    } else if (line.startsWith('**') && line.endsWith('**')) {
      if (Object.keys(currentEntry).length > 0) {
        if (!currentEntry.description) currentEntry.description = '';
        validateEntry(currentEntry);
        result.push(currentEntry);
      }

      currentEntry = { name: line.replace(/\*\*/g, '').trim() };
      if (currentClass) currentEntry.class = currentClass;
      if (currentType) currentEntry.type = currentType;
      descriptionBuffer = '';
    } else if (line.includes('{') && !line.includes('}')) {
      isInsideDescription = true;
      descriptionBuffer += line.split('{')[1].trim() + '\n';
    } else if (line.includes('}')) {
      descriptionBuffer += line.split('}')[0].trim();
      currentEntry.description = descriptionBuffer.trim();
      isInsideDescription = false;
    } else if (isInsideDescription) {
      descriptionBuffer += line.trim() + '\n';
    } else if (line.startsWith('Required:')) {
      currentEntry.required = line.replace('Required:', '').trim();
    } else if (line.startsWith('Replaces:')) {
      currentEntry.replaces = line.replace('Replaces:', '').trim();
    } else if (line.startsWith('Icon:')) {
      const iconMatch = line.match(/<img src="https:\/\/seiyria\.com\/gameicons-font\/svg\/([^.]+)\.svg"[^>]*width="(\d+)"[^>]*\/>/);
      if (iconMatch) {
        currentEntry.icon = iconMatch[1].trim();
      } else {
        console.error(`Failed to parse icon in line: ${line}`);
      }
    }
  });

  if (Object.keys(currentEntry).length > 0) {
    if (!currentEntry.description) currentEntry.description = '';
    validateEntry(currentEntry);
    result.push(currentEntry);
  }

  result.forEach(entry => {
    if (entry.description) {
      entry.description = entry.description.replace(/[{}]/g, '').trim();
    }
  });

  return result;
}

// Validate that every entry has "icon", "name", and "type"
function validateEntry(entry) {
  if (!entry.icon || !entry.name || !entry.type) {
    throw new Error(`Entry validation failed. Missing required fields in entry: ${JSON.stringify(entry)}`);
  }
}

// Main function to handle arguments and processing
function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1 || !['json', 'md'].includes(args[0])) {
    console.error('Usage: node script.js <json|md>');
    process.exit(1);
  }

  if (fs.existsSync(JSON_FILE_PATH)) {
    const jsonData = loadJsonData();
    fs.writeFileSync(BACKUP_JSON_FILE_PATH, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`Backup of moves.json created as moves-old.json`);
  } else {
    console.log("Could not find moves.json. Continuing with parsing...");
  }

  if (args[0] === 'json') {
    const mdContent = fs.readFileSync(MD_FILE_PATH, 'utf-8');
    const jsonData = markdownToJson(mdContent);
    saveAsJson(jsonData);
  } else if (args[0] === 'md') {
    const jsonData = loadJsonData();
    saveAsMarkdown(jsonData);
  }
}

main();
