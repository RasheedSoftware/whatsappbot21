const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
let qrCodeUrl = null; // Variable to store QR Code
const port = process.env.PORT || 4000;

const {
    addBlockedWord,
    removeBlockedWord,
    addHelpRequest,
    removeHelpRequest,
    loadBlockedWords,
    loadHelpRequests,
    isSimilarMessage,
    blockedWords,
    helpRequests,
    showBlockedWords
} = require('./wordManager');

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth() // Keep session persistent
});

// Display QR code in the terminal for authentication
client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
            console.log( `${qr}` )
    console.log('✅ QR Code received. Open your browser to scan it.');
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Failed to generate QR code', err);
            return;
        }
        qrCodeUrl = url; // Store QR Code as Base64 image
        console.log( `${qrcode} `)
        console.log( `${qr}` )
        console.log('Scan the QR code to log in.');
    });
});

// On login
client.on('ready', () => {
    console.log('🚀 Bot is ready and connected to WhatsApp!');
    qrCodeUrl = null; // Clear QR Code after login
});

// Setup Express
app.get('/', (req, res) => {
    if (qrCodeUrl) {
        res.send(`
            <html>
                <body style="text-align:center; font-family:Arial;">
                    <h1>Scan QR Code to Login</h1>
                    <img src="${qrCodeUrl}" alt="QR Code">
                    <p>Open WhatsApp on your phone to scan the code.</p>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body style="text-align:center; font-family:Arial;">
                    <h1>Bot is already connected to WhatsApp!</h1>
                </body>
            </html>
        `);
    }
});

// Load words
loadBlockedWords();
let isLocked = false;

// Utility functions
function isHelpRequest(messageBody) {
    for (const category in helpRequests) {
        if (helpRequests[category].some(word => messageBody.includes(word))) {
            return category;
        }
    }
    return null;
}

// Check if a user is an admin in a group
async function isAdmin(chat, userId) {
    try {
        const participants = await chat.participants; // Fetch group participants
        const user = participants.find(p => p.id._serialized === userId);
        return user?.isAdmin || user?.isSuperAdmin; // Return true if the user is admin
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Check if a message contains blocked words
const isMessageBlocked = (message) => {
    console.log("Checking message:", message);
    console.log("Blocked words:", blockedWords);

    if (!Array.isArray(blockedWords)) {
        console.error("blockedWords is not defined or is not an array.");
        return false;
    }

    return blockedWords.some((word) => message.includes(word));
};

// Function to get shared groups with the user
async function getSharedGroups(senderId) {
    const chats = await client.getChats();
    const groupChats = chats.filter(chat => chat.isGroup); // Get only groups

    const sharedGroups = [];
    for (const group of groupChats) {
        const participants = await group.participants;
        const isInGroup = participants.some(participant => participant.id._serialized === senderId);

        if (isInGroup) {
            sharedGroups.push(group.name);
        }
    }

    return sharedGroups;
}

// Handle blocked messages
async function handleBlockedMessage(message) {
    const chat = await message.getChat();
    const participant = message.author; // Sender's number

    const warningMessage = 'Warning: You have sent a message containing blocked words.';
    await message.reply(warningMessage);

    let data = {
        name: message.name,
        phoneNumber: message.phoneNumber,
        message: msg.body, // The received message
        typeDevice: message.typeDevice, // Change as needed
        timestamp: new Date().toISOString() // Use current date and time
    };

    await message.delete(true); // True for immediate deletion

    if (chat.isGroup) {
        if (typeof chat.removeParticipants === 'function') {
            await chat.removeParticipants([participant]);
            console.log(`Removed ${participant} from the group.`);
        }
    }
}

// Main logic to monitor messages
client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        const contact = await msg.getContact();

        if (chat.isGroup ) {
            const senderId = msg.author; // Sender's ID
            const about = await contact.about || "no about info";
            const newsstatus = await contact.status ||  "unknown";
            const typeDevice = msg.typeDevice;
            const sharedGroups = await getSharedGroups(senderId);

            const restss = msg.body.split(' ');
            const wordss = restss.join(' ');
            const wordToAddss = wordss.trim();

            if (isSimilarMessage(wordToAddss, 0.45)) {
                let dataIfonBlock = {
                    username: contact.pushname || "Unnamed",
                    phoneNumber: senderId,
                    message: wordToAddss,
                    typeDevice: msg.deviceType || "unknown",
                    newsstatus: newsstatus ||  "unknown",
                    about: about,
                    contactType: contact.isBusiness ? "Business" : "Regular",
                    sharedGroups: sharedGroups.length,
                    timestamp: new Date().toISOString()
                };
                addBlockedWord(dataIfonBlock);
            }

            // Command handling
            const [command, category, ...rest] = msg.body.split(' ');
            const word = rest.join(' '); // Join the rest for cases where the word has spaces

            if (msg.body.startsWith('!addword11 ')) {
                let dataIfonBlock = {
                    username: contact.pushname  || "Unnamed",
                    phoneNumber: senderId,
                    message: word,
                    typeDevice: msg.deviceType || "unknown",
                    newsstatus: newsstatus ||  "unknown",
                    about: about,
                    contactType: contact.isBusiness ? "Business" : "Regular",
                    sharedGroups: sharedGroups.length,
                    timestamp: new Date().toISOString()
                };
                const wordToAdd = word.trim();
                if (wordToAdd) {
                    addBlockedWord(dataIfonBlock);
                    let responseMessage = `✅\nBlocked word added:\n`;
                    for (const [key, value] of Object.entries(dataIfonBlock)) {
                        responseMessage += `  ${key}: "${value}"\n`;
                    }
                }
                return;
            }

            if (msg.body.startsWith('!removeword11 ')) {
                const wordToRemove = word.trim();
                if (wordToRemove) {
                    removeBlockedWord(wordToRemove);
                    msg.reply(`✅ Blocked word removed: "${wordToRemove}"`);
                }
                return;
            }

            if (msg.body === '!showwords11') {
                showBlockedWords();
                msg.reply(`📋 Current blocked words:\n${blockedWords.join(', ')}`);
                return;
            }

            if (msg.body.startsWith('!addrequest11 ')) {
                addHelpRequest(category, word);
                msg.reply(`✅ Word "${word}" added to category "${category}".`);
                return;
            }

            if (msg.body === '!showrequests11') {
                let response = '📋 Current words for each category:\n';
                for (const cat in helpRequests) {
                    response += `\n*${cat}:* ${helpRequests[cat].join(', ')}`;
                }
                msg.reply(response);
                return;
            }

            if (msg.body === '!lock11') {
                isLocked = true;
                msg.reply('🔒 Bot is now locked.');
                return;
            }

            if (msg.body === '!unlock11') {
                isLocked = false;
                msg.reply('🔓 Bot is now unlocked.');
                return;
            }
        }
    } catch (error) {
        console.error("Error handling message:", error);
    }
});

// Start the bot
client.initialize();
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
