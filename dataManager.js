const { loadData, saveData } = require('./jsonUtils');

// Load data into memory
let blockedWords = loadData('blockedWords.json');
let helpRequests = loadData('helpRequests.json');

// Add a word to the blocked words
function addBlockedWord(word) {
    if (!blockedWords.includes(word)) {
        blockedWords.push(word);
        saveData('blockedWords.json', blockedWords); // Save to JSON
        console.log(`✅ Added blocked word: ${word}`);
        return true;
    } else {
        console.log(`🚫 Word already exists: ${word}`);
        return false;
    }
}
// Remove a word from the blocked words
function removeBlockedWord(word) {
    if (blockedWords.includes(word)) {
        blockedWords = blockedWords.filter(w => w !== word);
        saveData('blockedWords.json', blockedWords); // Save to JSON
        console.log(`✅ Removed blocked word: ${word}`);
        return true;
    } else {
        console.log(`🚫 Word not found: ${word}`);
        return false;
    }
}

// Add a request word to a category
function addHelpRequest(category, word) {
    if (!helpRequests[category]) {
        helpRequests[category] = []; // Create category if not exists
    }
    if (!helpRequests[category].includes(word)) {
        helpRequests[category].push(word);
        saveData('helpRequests.json', helpRequests); // Save to JSON
        console.log(`✅ Added help request word: ${word} to category: ${category}`);
        return true;
    } else {
        console.log(`🚫 Word already exists in category: ${category}`);
        return false;
    }
}

// Remove a request word from a category
function removeHelpRequest(category, word) {
    if (helpRequests[category] && helpRequests[category].includes(word)) {
        helpRequests[category] = helpRequests[category].filter(w => w !== word);
        saveData('helpRequests.json', helpRequests); // Save to JSON
        console.log(`✅ Removed help request word: ${word} from category: ${category}`);
        return true;
    } else {
        console.log(`🚫 Word not found in category: ${category}`);
        return false;
    }
}

// Export functions for use
module.exports = {
    addBlockedWord,
    removeBlockedWord,
    addHelpRequest,
    removeHelpRequest,
    blockedWords,
    helpRequests
};