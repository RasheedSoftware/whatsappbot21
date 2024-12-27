const stringSimilarity = require('string-similarity');
const {
    addBlockedWord,
    removeBlockedWord,
    addHelpRequest,
    removeHelpRequest,
    loadBlockedWords,
    loadHelpRequests,
    showBlockedWords,
    blockedWords
} = require('./wordManager');


// حساب نسبة التشابه

function isSimilarMessage(newMessage, threshold = 0.8) {
    if (!Array.isArray(blockedWords)) {
        throw new Error("blockedWords is not defined or not an array");
    }

    const similarities = blockedWords.map(msg => {
        return stringSimilarity.compareTwoStrings(msg.message, newMessage);
    });
    co
    return similarities.some(similarity => similarity >= threshold);
}
module.exports = isSimilarMessage; // تصدير الدالة

// Export functions for use
// module.exports = {
//     isSimilarMessage 

// };

/*
const { Client, LocalAuth } = require('whatsapp-web.js');
const cosineSimilarity = require('cosine-similarity');
const fs = require('fs');
const natural = require('natural');

const client = new Client({
    authStrategy: new LocalAuth(),
});

const storedMessagesFile = 'storedMessages.json';
let storedMessages = JSON.parse(fs.existsSync(storedMessagesFile) ? fs.readFileSync(storedMessagesFile, 'utf-8') : '[]');

// تحويل نص إلى تمثيل عددي باستخدام TF-IDF
function getTFIDFVector(text) {
    const tfidf = new natural.TfIdf();
    storedMessages.forEach(msg => tfidf.addDocument(msg.message));
    const vector = [];
    tfidf.titles.forEach(title => {
        vector.push(tfidf.tfidfs[title][0] || 0);
    });
    return vector;
}

// حساب التشابه باستخدام Cosine Similarity
function isSimilarMessage(newMessage, threshold = 0.8) {
    const newVector = getTFIDFVector(newMessage);
    return storedMessages.some(msg => {
        const existingVector = getTFIDFVector(msg.message);
        const similarity = cosineSimilarity(newVector, existingVector);
        return similarity >= threshold;
    });
}

*/

/*
const stringSimilarity = require('string-similarity');
const fs = require('fs');

const storedMessagesFile = 'storedMessages.json';
let storedMessages = JSON.parse(fs.existsSync(storedMessagesFile) ? fs.readFileSync(storedMessagesFile, 'utf-8') : '[]');

// حساب نسبة التشابه
function isSimilarMessage(newMessage, threshold = 0.7) {
    const similarities = storedMessages.map(msg => {
        return stringSimilarity.compareTwoStrings(msg.message, newMessage);
    });
    return similarities.some(similarity => similarity >= threshold);
}
////////////////////////


const storedMessagesFile = 'storedMessages.json';
let storedMessages = JSON.parse(fs.existsSync(storedMessagesFile) ? fs.readFileSync(storedMessagesFile, 'utf-8') : '[]');

// حساب نسبة التشابه
function isSimilarMessage(newMessage, threshold = 0.8) {
    const similarities = storedMessages.map(msg => {
        return stringSimilarity.compareTwoStrings(msg.message, newMessage);
    });
    return similarities.some(similarity => similarity >= threshold);
}
*/