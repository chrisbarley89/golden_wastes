const fs = require('fs');
const path = require('path');

// Constant to specify the output directory for generated files
const fileName = path.join(__dirname, "/data/moves.json");
const OUTPUT_DIR = path.join(__dirname, '/content/docs/rules/move'); // Change 'output' to your preferred directory name

// Reserved names in Windows
const RESERVED_NAMES = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "COM0",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9", "LPT0"
];

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to normalize the name into a URL-friendly format and avoid reserved names
function normalizeNameForURL(name) {
    let normalizedName = name
        .toLowerCase()                   // Convert to lowercase
        .replace(/\s+/g, '-')             // Replace spaces with dashes
        .replace(/[^\w\-]/g, '')          // Remove all non-alphanumeric characters, except dashes
        .replace(/--+/g, '-')             // Replace multiple dashes with a single dash
        .replace(/^-+/, '')               // Remove leading dashes
        .replace(/-+$/, '');              // Remove trailing dashes

    // If normalized name is a reserved Windows name, add a suffix to make it unique
    if (RESERVED_NAMES.includes(normalizedName.toUpperCase())) {
        normalizedName += '-move';
    }

    return normalizedName;
}

// Function to process the JSON file and create markdown files
function processJsonFile(fileName) {
    // Read the file asynchronously
    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file ${fileName}: ${err}`);
            return;
        }

        try {
            // Parse the data as JSON
            const jsonData = JSON.parse(data);

            // Loop through each entry in the JSON
            jsonData.forEach(entry => {
                // Check for required fields: name, description, type
                if (!entry.name || !entry.description || !entry.type) {
                    console.error(`Missing required fields in entry: ${JSON.stringify(entry)}`);
                    return; // Skip this entry and continue with the next one
                }

                // Normalize the name for the URL
                const normalizedName = normalizeNameForURL(entry.name);

                // Start constructing the markdown content with the new frontmatter
                let mdContent = `---
bookHidden: true
BookToC: false
title: "${entry.name}"
type: "wiki"
---`;
                // Class and type
                mdContent +=`\n## ${entry.class || ''} ${entry.type} Move`;

                mdContent += `\n{{< infobox name="${entry.name}" type="${entry.type || ""}" class="${entry.class || ""}" >}}`

                // Add "Requires" if the field exists
                if (entry.requires) {
                    mdContent += `\n\nRequires: ${entry.requires}`;
                }

                // Add "Replaces" if the field exists
                if (entry.replaces) {
                    mdContent += `\n\nReplaces: ${entry.replaces}`;
                }

                // Add the description
                mdContent += `\n\n${entry.description}`;

                // Define the output file path using the OUTPUT_DIR constant
                const mdFilePath = path.join(OUTPUT_DIR, `${normalizedName}.md`);

                // Write the markdown content to a new file
                fs.writeFile(mdFilePath, mdContent, 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error(`Error writing to file ${mdFilePath}: ${writeErr}`);
                    } else {
                        console.log(`Markdown file created: ${mdFilePath}`);
                    }
                });
            });
        } catch (parseErr) {
            console.error(`Error parsing JSON from file ${fileName}: ${parseErr}`);
        }
    });
}

if (!fileName) {
    console.error("Usage: node createMarkdownFiles.js <fileName>");
} else {
    processJsonFile(fileName);
}
