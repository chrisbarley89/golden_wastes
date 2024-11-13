const fs = require('fs');
const path = require('path');

// Example usage
const inputFilePath = path.join(__dirname, '/data/moves.json');  // Your input JSON file path
const outputFilePath = path.join(__dirname, '/content/docs/rules/move/_index.md');  // Updated output markdown file path

// Configuration
const iconSize = "20"

// Reserved names in Windows
const RESERVED_NAMES = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "COM0",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9", "LPT0"
];

// Function to sanitize and generate a hyperlink-friendly format for move names
function formatNameForHyperlink(name) {
    let formattedName = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]|(?<![a-z])-|-(?![a-z])/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    // If formatted name is a reserved Windows name, add a suffix to make it unique
    if (RESERVED_NAMES.includes(formattedName.toUpperCase())) {
        formattedName += '-move';
    }

    return formattedName;
}

// Function to generate the markdown content from the JSON data
function generateMarkdown(moves) {
    const noClassMoves = moves.filter(move => !move.class);
    const classMoves = moves.filter(move => move.class);

    const sortMovesByName = (a, b) => a.name.localeCompare(b.name);

    const groupedMoves = classMoves.reduce((groups, move) => {
        if (!move.class) return groups;
        const type = move.type ? move.type.toLowerCase() : '';
        if (!groups[move.class]) {
            groups[move.class] = { optional: [], starting: [], advanced: [], expert: [] };
        }
        if (type === 'optional') {
            groups[move.class].optional.push(move);
        } else if (type === 'starting') {
            groups[move.class].starting.push(move);
        } else if (type === 'advanced') {
            groups[move.class].advanced.push(move);
        } else if (type === 'expert') {
            groups[move.class].expert.push(move);
        }
        return groups;
    }, {});

    for (let className in groupedMoves) {
        groupedMoves[className].optional.sort(sortMovesByName);
        groupedMoves[className].starting.sort(sortMovesByName);
        groupedMoves[className].advanced.sort(sortMovesByName);
        groupedMoves[className].expert.sort(sortMovesByName);
    }

    // Add the header text at the top of the output
    let markdown = `---
bookSearchExclude: true
bookHidden: true
---\n\n`;

    if (noClassMoves.length > 0) {
        markdown += '## Basic Moves\n';
        noClassMoves.sort(sortMovesByName).forEach(move => {
            const linkName = formatNameForHyperlink(move.name);
            markdown += `- {{< icon source="https://seiyria.com/gameicons-font/svg/${move.icon}.svg" name="${move.icon}" size="${iconSize}" >}} [${move.name}]({{< ref "/docs/rules/move/${linkName}" >}})\n`;
        });
        markdown += '\n';
    }

    const classes = ['Bard', 'Fighter', 'Paladin', 'Ranger', 'Thief'];
    classes.forEach(className => {
        if (groupedMoves[className] && Object.keys(groupedMoves[className]).length > 0) {
            markdown += `## ${className} Moves\n`;
            ['optional', 'starting', 'advanced', 'expert'].forEach(type => {
                const movesOfType = groupedMoves[className][type];
                if (movesOfType.length > 0) {
                    markdown += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Moves\n`;
                    movesOfType.forEach(move => {
                        const linkName = formatNameForHyperlink(move.name);
                        markdown += `- {{< icon source="https://seiyria.com/gameicons-font/svg/${move.icon}.svg" name="${move.icon}" size="${iconSize}" >}} [${move.name}]({{< ref "/docs/rules/move/${linkName}" >}})\n`;
                    });
                    markdown += '\n';
                }
            });
        }
    });

    return markdown;
}

// Main function to read the JSON, process, and write to the markdown file
function generateMoveIndex(inputFilePath, outputFilePath) {
    fs.readFile(inputFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading the JSON file:', err);
            return;
        }

        try {
            const moves = JSON.parse(data);
            const markdown = generateMarkdown(moves);

            const outputDir = path.dirname(outputFilePath);

            // Ensure the directory exists
            fs.mkdir(outputDir, { recursive: true }, (err) => {
                if (err) {
                    console.error('Error creating the output directory:', err);
                    return;
                }

                // Write the markdown to a .md file
                fs.writeFile(outputFilePath, markdown, (err) => {
                    if (err) {
                        console.error('Error writing the markdown file:', err);
                    } else {
                        console.log('Move index markdown file generated successfully!');
                    }
                });
            });
        } catch (e) {
            console.error('Error parsing the JSON data:', e);
        }
    });
}

generateMoveIndex(inputFilePath, outputFilePath);
