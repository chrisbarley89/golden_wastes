const fs = require('fs');

// Replace with your JSON file paths
const originalFile = './local/moves-old.json';
const parsedFile = './data/moves.json';
const logFile = './local/moves-changes.txt';

function getCurrentDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = String(now.getFullYear()).slice(2); // Get last two digits of the year
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function writeHeaderToFile(outputFilePath) {
    const header = `File generated on: ${getCurrentDateTime()}\n\n`;
    fs.writeFileSync(outputFilePath, header, 'utf8');
}

// Function to read and parse JSON file
function readAndParseJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`ERROR READING OR PARSING JSON FILE: ${filePath}`, error);
        process.exit(1);
    }
}

function deepCompareAndPrintDifferences(obj1, obj2, path = '', entryNumber = 0, output = '', foundDifferences = false) {
    // Check if the types of obj1 and obj2 are different
    if (typeof obj1 !== typeof obj2) {
        const difference = `DIFFERENCE FOUND AT ${path} (ENTRY #${entryNumber})\n` +
            `ORIGINAL = ${JSON.stringify(obj1, null, 2)}\n` +
            `PARSED = ${JSON.stringify(obj2, null, 2)}\n` +
            `ISOLATED DIFFERENCE: (${JSON.stringify(obj1)}, ${JSON.stringify(obj2)})\n\n`;
        output += difference;
        foundDifferences = true;
    }

    // Compare arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
            const difference = `DIFFERENCE FOUND AT ${path} (ENTRY #${entryNumber})\n` +
                `ARRAY LENGTHS DIFFER - ORIGINAL = ${obj1.length}, PARSED = ${obj2.length}\n\n`;
            output += difference;
            foundDifferences = true;
        }
        for (let i = 0; i < obj1.length; i++) {
            const result = deepCompareAndPrintDifferences(obj1[i], obj2[i], `${path}[${i}]`, entryNumber + i, output, foundDifferences);
            output = result.output;
            foundDifferences = result.foundDifferences;
        }
    } 
    // Compare objects
    else if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        const allKeys = new Set([...keys1, ...keys2]);
        allKeys.forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            if (!keys1.includes(key)) {
                const difference = `DIFFERENCE FOUND AT ${newPath} (ENTRY #${entryNumber})\n` +
                    `KEY MISSING IN FILE1: ${key}, PARSED = ${JSON.stringify(obj2[key], null, 2)}\n\n`;
                output += difference;
                foundDifferences = true;
            } else if (!keys2.includes(key)) {
                const difference = `DIFFERENCE FOUND AT ${newPath} (ENTRY #${entryNumber})\n` +
                    `KEY MISSING IN FILE2: ${key}, ORIGINAL = ${JSON.stringify(obj1[key], null, 2)}\n\n`;
                output += difference;
                foundDifferences = true;
            } else {
                const result = deepCompareAndPrintDifferences(obj1[key], obj2[key], newPath, entryNumber, output, foundDifferences);
                output = result.output;
                foundDifferences = result.foundDifferences;
            }
        });
    } 
    // Compare simple values
    else if (obj1 !== obj2) {
        const difference = `DIFFERENCE FOUND AT ${path} (ENTRY #${entryNumber})\n` +
            `ORIGINAL = ${JSON.stringify(obj1, null, 2)}\n` +
            `PARSED = ${JSON.stringify(obj2, null, 2)}\n` +
            `ISOLATED DIFFERENCE: ${getIsolatedDifference(obj1, obj2)}\n\n`;
        output += difference;
        foundDifferences = true;
    }

    return { output, foundDifferences };
}

function getIsolatedDifference(val1, val2) {
    // Convert both values to strings and find the first character difference
    let str1 = JSON.stringify(val1);
    let str2 = JSON.stringify(val2);
    let differences = [];

    for (let i = 0; i < Math.max(str1.length, str2.length); i++) {
        if (str1[i] !== str2[i]) {
            differences.push(`("${str1[i]}", "${str2[i]}", ${i})`);
        }
    }

    return differences.length > 0 ? differences.join(", ") : "No visible difference";
}

function compareJSONFiles(originalFile, parsedFile, outputFilePath = 'moves-changes.txt') {
    const data1 = readAndParseJSON(originalFile);
    const data2 = readAndParseJSON(parsedFile);

    let output = "";
    let foundDifferences = false;

    // Write header with date/time at the top of the output file
    writeHeaderToFile(outputFilePath);

    // Start comparison
    const result = deepCompareAndPrintDifferences(data1, data2, '', 0, output, foundDifferences);
    output = result.output;
    foundDifferences = result.foundDifferences;

    // If there are differences, write to the text file
    if (foundDifferences) {
        fs.appendFileSync(outputFilePath, output, 'utf8');
        console.log(`Differences found. Comparison complete. Output saved to '${outputFilePath}'.`);
    } else {
        fs.appendFileSync(outputFilePath, "No differences found.\n", 'utf8');
        console.log("No differences found.");
    }
}

// Example usage: Specify custom output file path
compareJSONFiles(originalFile, parsedFile, logFile);
