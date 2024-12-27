const fs = require('fs');
const path = require('path');

// Helper function: Get file path
function getFilePath(fileName) {
    return path.join(__dirname, fileName);
}

// Helper function: Load JSON into array
function loadData(fileName) {
    try {
        const filePath = getFilePath(fileName);
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Error loading JSON file (${fileName}):`, error);
        return [];
    }
}

// Helper function: Save array back to JSON
function saveData(fileName, dataArray) {
    try {
        const filePath = getFilePath(fileName);
        fs.writeFileSync(filePath, JSON.stringify(dataArray, null, 2), 'utf-8');
        console.log(`✅ Data saved to JSON file (${fileName}).`);
    } catch (error) {
        console.error(`❌ Error saving JSON file (${fileName}):`, error);
    }
}

// Export utility functions
module.exports = { loadData, saveData };