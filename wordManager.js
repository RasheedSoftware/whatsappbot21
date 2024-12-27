 const fs = require('fs');
 const stringSimilarity = require('string-similarity');
 const cosineSimilarity = require('cosine-similarity');
 const natural = require('natural');
 
// Initialize blocked words and help requests
let blockedWords = [];
let helpRequests = {
    specialist: [],
    tutor: [],
    assistance: []
};
const loadBlockedWords = () => {
    const path = 'jsonUtils/blockedWords.json'; // تأكد من أن المسار صحيح
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf8');
        const parsedData = JSON.parse(data);
        blockedWords = Array.isArray(parsedData.blockedWords) ? parsedData.blockedWords : []; // تأكد من أنه مصفوفة
    } else {
        blockedWords = []; // إذا لم يكن الملف موجودًا، ابدأ بمصفوفة فارغة
    }
};

const loadHelpRequests = () => {
    const path = 'jsonUtils/helpRequests.json'; // تأكد من المسار الصحيح
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf8'); // قراءة الملف
         
        const parsedData= JSON.parse(data).helpRequests; // تحليل البيانات
        helpRequests = Array.isArray(parsedData.helpRequests) ? parsedData.helpRequests : []; // تأكد من أنه مصفوفة

    } else {
        // إذا لم يكن الملف موجودًا، يمكنك إنشاءه بمحتوى افتراضي
        saveHelpRequests(); // قم بإنشاء ملف افتراضي
    }
};
// Save blocked words to JSON file
const saveBlockedWords = () => {
    fs.writeFileSync('jsonUtils/blockedWords.json', JSON.stringify({ blockedWords }, null, 2));
};

// Save help requests to JSON file
const saveHelpRequests = () => {
    fs.writeFileSync('jsonUtils/helpRequests.json', JSON.stringify({ helpRequests }, null, 2));
};

// Add a blocked word
const addBlockedWord = (word) => {
    if (word && !blockedWords.includes(word)) {
        blockedWords.push(word);
        saveBlockedWords(); // احفظ الكلمات المحظورة بعد الإضافة
        console.log(`تم إضافة الكلمة المحظورة: ${word}`);
    } else {
        console.log(`الكلمة "${word}" موجودة بالفعل أو غير صحيحة.`);
    }
};
// Remove a blocked word
const removeBlockedWord = (word) => {
    blockedWords = blockedWords.filter(w => w !== word);
    saveBlockedWords();
    console.log(`Removed blocked word: ${word}`);
};

// Add a help request
const addHelpRequest = (category, request) => {
    if (helpRequests[category] && !helpRequests[category].includes(request)) {
        helpRequests[category].push(request);
        saveHelpRequests();
        console.log(`Added help request: ${request} to category: ${category}`);
    } else {
        console.log(`Request "${request}" is already in the category "${category}" or category does not exist.`);
    }
};

// Remove a help request
const removeHelpRequest = (category, request) => {
    if (helpRequests[category]) {
        helpRequests[category] = helpRequests[category].filter(r => r !== request);
        saveHelpRequests();
        console.log(`Removed help request: ${request} from category: ${category}`);
    }
};

const showBlockedWords = () => {
    if (!Array.isArray(blockedWords)) {
        console.error("blockedWords is not defined or is not an array.");
        return;
    }
    console.log("الكلمات المحظورة:", blockedWords.join(', ')); // استخدام join لعرض الكلمات
};


// function getTFIDFVector(text) {
//     const tfidf = new natural.TfIdf();

//     if (!Array.isArray(blockedWords)) {
//         console.error("blockedWords is not an array:", blockedWords);
//         return [];
//     }

//     blockedWords.forEach(msg => {
//         if (msg.message) {
//             tfidf.addDocument(msg.message);
//         } else {
//             console.error("Blocked word is missing 'message':", msg);
//         }
//     });

//     const vector = [];
//     tfidf.titles.forEach(title => {
//         vector.push(tfidf.tfidfs[title][0] || 0);
//     });
//     return vector;
// }
// const getTFIDFVector = (text) => {
//     loadBlockedWords(); // تحميل blockedWords عند استدعاء الدالة
//     const tfidf = new natural.TfIdf();

//     // Check if blockedWords is defined and an array
//     if (!Array.isArray(blockedWords)) {
//         throw new Error("blockedWords is not defined or is not an array");
//     }

//     // Use map to extract messages and filter out any undefined messages
//     const messages = blockedWords
//         .map(msg => msg.message)
//         .filter(message => message !== undefined);

//     messages.forEach(message => {
//         tfidf.addDocument(message);
//     });

//     const vector = tfidf.titles.map(title => tfidf.tfidfs[title][0] || 0);
//     return vector;
// };

// const isSimilarMessage = (newMessage, threshold = 0.8) => {
//     if (!newMessage || typeof newMessage !== 'string') {
//         throw new Error("newMessage must be a non-empty string");
//     }

//     const newVector = getTFIDFVector(newMessage);
//     return blockedWords.some(msg => {
//         const existingVector = getTFIDFVector(msg.message);
//         const similarity = cosineSimilarity(newVector, existingVector);
//          return similarity >= threshold;
//     });
// };

function isSimilarMessage(newMessage, threshold = 0.4) {
    if (!Array.isArray(blockedWords)) {
        throw new Error("blockedWords is not defined or not an array");
    }

    const similarities = blockedWords.map(msg => {
        if (!msg.message || typeof msg.message !== 'string') {
            console.error("Blocked word is undefined or not a string:");
            return 0; // أو يمكنك إرجاع قيمة افتراضية أخرى
        }
        return stringSimilarity.compareTwoStrings(msg.message, newMessage);
    });
    console.log(`similaritiessssssssss in `);

    return similarities.some(similarity => similarity >= threshold);
}


// Load initial data
loadBlockedWords();
loadHelpRequests();

// Export functions for use
module.exports = {
    addBlockedWord,
    removeBlockedWord,
    addHelpRequest,
    removeHelpRequest,
    loadBlockedWords,
    loadHelpRequests,
    showBlockedWords,
    helpRequests,
    blockedWords,
    isSimilarMessage


};