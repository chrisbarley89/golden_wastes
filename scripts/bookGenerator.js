// Input and output file paths
const inputFilePath = './data/moves.json';
const outputFilePath = './local/book-generated.md';

const fs = require('fs');

// Configurable settings
const CLASS_HEADER = '##';  // Format for class titles
const TYPE_HEADER = '###';  // Format for type titles
const MOVE_HEADER = '####'; // Format for move name
const MOVE_MARKER = '✴';    // Special character to remove and format as a bullet point

// Function to clean and format descriptions
const cleanDescription = (description) => {
    // Remove all instances of ✴
    description = description.replace(/✴/g, '').trim(); // Trim after removal to avoid trailing spaces

    // Handle special cases like "On a 10", "On a 7-9", "On a 7–9", "On a 6"
    const specialCases = [
        'On a 10', 'On a 7-9', 'On a 7–9', 'On a 7-9,', 'On a 7+,', 'On a 6'
    ];

    specialCases.forEach((text) => {
        // Create a bullet-pointed version of special case
        const bulletText = `${MOVE_MARKER} ${text}`;
        const regex = new RegExp(text, 'g');
        description = description.replace(regex, `\n- ${bulletText}`);
    });

    // Format bullet points (if not already in bullet format) and ensure the marker is not empty
    description = description.replace(/•/g, '-');  // Replace any bullet symbol with markdown '-'

    // Remove any bullet points that don't have content (such as - ✴)
    description = description.replace(/-\s*✴\s*\n/g, ''); // Remove empty bullet points caused by isolated ✴

    return description.trim();
};

// Function to categorize moves by class and type
const categorizeMoves = (moves) => {
    const categorized = {};

    moves.forEach(move => {
        const { class: moveClass, type, name, description } = move;
        if (!moveClass || !type) return;  // Skip entries without necessary data

        // Initialize categories if not present
        if (!categorized[moveClass]) categorized[moveClass] = {};
        if (!categorized[moveClass][type]) categorized[moveClass][type] = [];

        // Clean and add move to the appropriate category
        const cleanedDescription = cleanDescription(description);
        categorized[moveClass][type].push({
            name,
            description: cleanedDescription
        });
    });

    return categorized;
};

// Function to create markdown file
const generateMarkdown = (categorizedMoves) => {
    let markdownContent = '';

    Object.keys(categorizedMoves).forEach(moveClass => {
        markdownContent += `\n${CLASS_HEADER} ${moveClass}\n`;

        Object.keys(categorizedMoves[moveClass]).forEach(type => {
            markdownContent += `\n${TYPE_HEADER} ${type}\n`;

            // Sort moves alphabetically by name
            const sortedMoves = categorizedMoves[moveClass][type].sort((a, b) => a.name.localeCompare(b.name));

            sortedMoves.forEach(move => {
                markdownContent += `\n${MOVE_HEADER} ${move.name}\n`;
                markdownContent += `${move.description}\n`;
            });
        });
    });

    // Save the generated markdown to a file
    fs.writeFileSync(outputFilePath, markdownContent);
};

// Main function to read, process, and generate markdown
const main = () => {
    // Read the JSON file
    const movesData = fs.readFileSync(inputFilePath, 'utf8');
    const moves = JSON.parse(movesData);

    // Categorize and process the moves
    const categorizedMoves = categorizeMoves(moves);

    // Generate the markdown
    generateMarkdown(categorizedMoves);

    console.log(`Markdown file generated successfully: ${outputFilePath}`);
};

// Run the script
main();
