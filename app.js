const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();

// استخدام المنفذ من البيئة أو استخدام منفذ افتراضي
const PORT = process.env.PORT || 4000;

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
    showBlockedWords,
    blockedcontact,
    loadBlockedcontact,
    addBlockedContact,
    saveBlockedkContact,
} = require('./wordManager');

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth() // Keep session persistent
});

// Display QR code in the terminal for authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code to log in.');
});

// Confirm bot is ready
client.on('ready', () => {
    console.log('✅ Bot is ready and connected to WhatsApp!');
});

// Load words and contacts
loadBlockedWords();
loadBlockedcontact();

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
        const participants = await chat.participants;
        const user = participants.find(p => p.id._serialized === userId);
        return user?.isAdmin || user?.isSuperAdmin;
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

// Fetch shared groups with the user
async function getSharedGroups(senderId) {
    const chats = await client.getChats();
    const groupChats = chats.filter(chat => chat.isGroup);

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

// Check for duplicate contacts
function isDuplicateContact(details) {
    return blockedcontact.some(msg => msg.contact.phone === details.phone);
}

// Handle contact messages
async function handleContact(msg, contact) {
    const contactCard = msg.vCards && msg.vCards.length > 0 ? msg.vCards[0] : null;

    if (contactCard) {
        const details = extractContactDetails(contactCard);
        console.log('📇 Contact details:', msg.vCards);

        if (isDuplicateContact(details)) {
            addBlockedContact(details);
            await msg.delete(true);
            console.log(`❌ Duplicate contact deleted from ${contact.number}`);
        } else {
          //  msg.reply('📇 . إذا كنت بحاجة لها، يرجى التواصل خاص.');
          addBlockedContact(details);

        }
    }
}

// Extract contact details from a vCard
function extractContactDetails(vCard) {
    const lines = vCard.split('\n');
    const nameLine = lines.find(line => line.startsWith('FN:')) || 'FN:غير معروف';
    const phoneLines = lines.filter(line => line.startsWith('item1.TEL;'));

    const name = nameLine.split(':')[1] || 'غير معروف';
    const phones = phoneLines.length > 0 
        ? phoneLines.map(line => line.split(':')[1]).join(', ') 
        : 'TEL:غير معروف';

    return {
        name: name.trim(),
        phones: phones || 'TEL:غير معروف',
    };
}




// Handle blocked messages
async function handleBlockedMessage(message) {
    const chat = await message.getChat();
    const participant = message.author;

    const warningMessage = 'تحذير: تم إرسال رسالة مزعجة أو تحتوي على كلمات محظورة.';
    await message.reply(warningMessage);

    let data = {
        name: message.name,
        phoneNumber: message.phoneNumber,
        message: message.body,
        typeDevice: message.typeDevice,
        timestamp: new Date().toISOString()
    };

    await message.delete(true);

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
        const senderId = msg.author;

  if (await isAdmin(chat, senderId)) {
                console.log("🔒 Cannot take action against an admin.");
              //  return; // Exit if the sender is an admin
            }
    //    if (chat.isGroup) {
  else if (chat.isGroup && (chat.name === 'MyBottry' ||chat.name==='ExpBot'||chat.name==='group123')) {

            const about = await contact.about || "no about info";
            const newsstatus = await contact.status || "unknown";
            const restss = msg.body.split(' ');
            const message1 =msg.body;
            const wordss = restss.join(' ');
            const wordToAddss = wordss.trim();
            const typeDevice = msg.typeDevice;
            const sharedGroups = await getSharedGroups(senderId);
            const urlRegex = /(https?:\/\/[^\s]+)/g;

            try {
                if (msg.type === 'vcard') {
                    await handleContact(msg, contact);
                }
               else if (urlRegex.test(message1)) {
                await  msg.delete(true);
                    msg.reply(`🚫 لا يُسمح بإرسال الروابط هنا. تم حذف الرسالة التي تحتوي على رابط. يُرجى إرسال الروابط فقط من قبل مشرفي المجموعة لتجنب النصابين.`);
                    //chat.sendMessage(`🚫 لا يُسمح بإرسال الروابط هنا. تم حذف الرسالة التي تحتوي على رابط. يُرجى إرسال الروابط فقط من قبل مشرفي المجموعة لتجنب النصابين.`);
                }
                else if (isSimilarMessage(wordToAddss, 0.45)) {
                    console.log(`📋 ${senderId} is in the following shared groups:`, sharedGroups);
                    let dataIfonBlock = {
                        username: contact.pushname || "Unnamed",
                        phoneNumber: senderId,
                        message: wordToAddss,
                        typeDevice: msg.deviceType || "Uutype",
                        newsstatus: newsstatus || "unknown",
                        about: about,
                        contactType: contact.isBusiness ? "Business" : "Regular",
                        sharedGroups: sharedGroups.length,
                        timestamp: new Date().toISOString()
                    };

                    if (chat.isGroup && (chat.name === 'MyBottry' || chat.name === 'ExpBot' || chat.name === 'group123')) {
                        await handleBlockedMessage(msg);
                    }

                    addBlockedWord(dataIfonBlock);
                }
            } catch (error) {
                console.error("Error in processing message:", error);
            }

            const [command, category, ...rest] = msg.body.split(' ');
            const word = rest.join(' ');

            if (msg.body.startsWith('!addword11 ')) {
                let dataIfonBlock = {
                    username: contact.pushname || "Unnamed",
                    phoneNumber: senderId,
                    message: word,
                    typeDevice: msg.deviceType || "Uutype",
                    newsstatus: newsstatus || "unknown",
                    about: about,
                    contactType: contact.isBusiness ? "Business" : "Regular",
                    sharedGroups: sharedGroups.length,
                    timestamp: new Date().toISOString()
                };
                const wordToAdd = word.trim();
                if (wordToAdd) {
                    addBlockedWord(dataIfonBlock);
                }
                return;
            }

            if (msg.body.startsWith('!removeword11 ')) {
                const wordToRemove = word.trim();
                if (wordToRemove) {
                    removeBlockedWord(wordToRemove);
                }
                return;
            }

            if (msg.body === '!showwords11') {
                showBlockedWords();
                return;
            }

            if (msg.body.startsWith('!addrequest11 ')) {
                addHelpRequest(category, word);
                return;
            }

            if (msg.body === '!showrequests11') {
                let response = '📋 الكلمات الحالية لكل فئة:\n';
                for (const cat in helpRequests) {
                    response += `\n*${cat}:* ${helpRequests[cat].join(', ')}`;
                }
                return;
            }

            if (msg.body === '!lock11') {
                isLocked = true;
                return;
            }

            if (msg.body === '!unlock11') {
                isLocked = false;
                return;
            }
        }
    } catch (error) {
        console.error("Error handling message:", error);
    }
});

// Start the bot
client.initialize();

// إعدادات التطبيق (مثل المسارات)
app.get('/', (req, res) => {
    res.send('مرحبا بكم في التطبيق!');
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`الخادم يعمل على http://localhost:${PORT}`);
});  
