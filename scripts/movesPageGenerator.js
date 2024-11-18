const fs = require('fs');

// Constants
const fileName = "./data/moves.json";  // Path to the JSON file
const OUTPUT_DIR = "./content/rules/move";  // Output directory
const iconSize = "75";

// Reserved Windows names
const RESERVED_NAMES = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "COM0",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9", "LPT0"
];

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Normalize name for URL-safe format
function normalizeNameForURL(name) {
    let normalizedName = name
        .toLowerCase()
        .replace(/\s+/g, '-')             // Replace spaces with dashes
        .replace(/[^\w\-]/g, '')          // Remove all non-alphanumeric characters, except dashes
        .replace(/--+/g, '-')             // Replace multiple dashes with a single dash
        .replace(/^-+/, '')               // Remove leading dashes
        .replace(/-+$/, '');              // Remove trailing dashes

    if (RESERVED_NAMES.includes(normalizedName.toUpperCase())) {
        normalizedName += '-move';
    }
    return normalizedName;
}

// Convert requires/replaces to relative links
function convertToRelativeLink(value) {
    return value
        .split(',')
        .map(item => `[${item.trim()}](/${normalizeNameForURL(item.trim())}/)`)
        .join(', ');
}

// Process JSON file
function processJsonFile(fileName) {
    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file ${fileName}: ${err}`);
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            jsonData.forEach(entry => {
                if (!entry.name || !entry.description || !entry.type) {
                    console.error(`Missing required fields in entry: ${JSON.stringify(entry)}`);
                    return;
                }

                const normalizedName = normalizeNameForURL(entry.name);

                // YAML Front Matter
                let mdContent = `---
bookHidden: true
BookToC: false
title: "${entry.name.replace(/"/g, '\\"')}"
type: "wiki"
infobox:
  header: "${entry.name.replace(/"/g, '\\"')}"
  icon: "https://seiyria.com/gameicons-font/svg/${entry.icon}.svg"
  iconSize: 50

  labels:
    - label: "Type"
      item: "${entry.type}"`;

                if (entry.class) {
                    mdContent += `
    - label: "Class"
      item: "${convertToRelativeLink(entry.class)}"`;
                }

                if (entry.requires || entry.replaces) {
                    mdContent += `
    - divider: true`;
                }

                if (entry.requires) {
                    mdContent += `
    - label: "Requires"
      item: "${convertToRelativeLink(entry.requires)}"`;
                }

                if (entry.replaces) {
                    mdContent += `
    - label: "Replaces"
      item: "${convertToRelativeLink(entry.replaces)}"`;
                }
                    mdContent += `
also:`
                if (entry.class) {
                    mdContent += `
    - "${entry.class}"`;
                }

                    mdContent += `
    - "how-to-play"`;
                
                mdContent += `
---`;

                // Content Body
                mdContent += `\n\n{{< infobox >}}\n\n${entry.description}`;

                const mdFilePath = `${OUTPUT_DIR}/${normalizedName}.md`;

                // Write the file
                fs.writeFile(mdFilePath, mdContent, 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error(`Error writing file ${mdFilePath}: ${writeErr}`);
                    } else {
                        console.log(`Generated: ${mdFilePath}`);
                    }
                });
            });
        } catch (parseErr) {
            console.error(`Error parsing JSON file: ${parseErr}`);
        }
    });
}

// Execute
if (!fileName) {
    console.error("Usage: node createMarkdownFiles.js <fileName>");
} else {
    processJsonFile(fileName);
}
