const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth() // Persistent session
});

// Display QR Code for authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('✅ Scan the QR code to log in.');
});

// Confirm bot is ready
client.on('ready', () => {
    console.log('🚀 Bot is ready and connected to WhatsApp!');
});

// Global variables
let helpRequests = {
    specialist: ["اريد", "ابغى", "مختص", "فاهم", "استشارة"],
    tutor: ["مدرس", "تعليم", "درس", "شرح"],
    assistance: ["مساعدة", "طلب", "احتاج", "هل يمكن"]
};

let blockedWords = ["spam", "مزعج", "كلمة1", "كلمة2"];
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

function containsBlockedWords(messageBody) {
    return blockedWords.some(word => messageBody.includes(word));
}

async function isAdmin(chat, userId) {
    const participants = await chat.participants;
    const user = participants.find(p => p.id._serialized === userId);
    return user?.isAdmin || user?.isSuperAdmin;
}

// Handle incoming messages
client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const messageBody = msg.body.toLowerCase();//impot

    if (isLocked) {
        console.log('🚫 Bot is locked. Ignoring message.');
        return;
    }

    if (containsBlockedWords(messageBody)) {
        console.log(`🚫 Blocked message detected: "${messageBody}"`);
        await msg.delete(true);
        msg.reply('⚠️ تحذير: تم حذف رسالتك لاحتوائها على كلمات محظورة.');
        return;
    }

    const requestCategory = isHelpRequest(messageBody);
    if (requestCategory) {
        console.log(`📌 Help request detected in category: ${requestCategory}`);
        msg.reply(`✅ تم التعرف على طلبك (${requestCategory})، يرجى الانتظار حتى يتم الرد.`);
        return;
    }

    if (chat.isGroup) {
        const senderId = msg.author;
        if (await isAdmin(chat, senderId)) {
            console.log("🔒 Message from admin. Ignoring.");
            return;
        }
    }

    console.log(`📨 Message received: ${messageBody}`);
});

// Admin commands
client.on('message', async (msg) => {
    const [command, category, word] = msg.body.split(' ');

    if (msg.body.startsWith('!addword ')) {
        if (!blockedWords.includes(word)) {
            blockedWords.push(word);
            msg.reply(`✅ تمت إضافة الكلمة المحظورة: "${word}"`);
        } else {
            msg.reply('🚫 الكلمة موجودة بالفعل.');
        }
        return;
    }

    if (msg.body.startsWith('!removeword ')) {
        if (blockedWords.includes(word)) {
            blockedWords = blockedWords.filter(w => w !== word);
            msg.reply(`✅ تمت إزالة الكلمة المحظورة: "${word}"`);
        } else {
            msg.reply('🚫 الكلمة غير موجودة.');
        }
        return;
    }

    if (msg.body === '!showwords') {
        msg.reply(`📋 الكلمات المحظورة الحالية:\n${blockedWords.join(', ')}`);
        return;
    }

    if (msg.body.startsWith('!addrequest ')) {
        if (helpRequests[category]) {
            helpRequests[category].push(word);
            msg.reply(`✅ تمت إضافة الكلمة "${word}" إلى فئة "${category}".`);
        } else {
            msg.reply(`🚫 الفئة "${category}" غير موجودة.`);
        }
        return;
    }

    if (msg.body === '!showrequests') {
        let response = '📋 الكلمات الحالية لكل فئة:\n';
        for (const cat in helpRequests) {
            response += `\n*${cat}:* ${helpRequests[cat].join(', ')}`;
        }
        msg.reply(response);
        return;
    }

    if (msg.body === '!lock') {
        isLocked = true;
        msg.reply('🔒 البوت مغلق الآن.');
        return;
    }

    if (msg.body === '!unlock') {
        isLocked = false;
        msg.reply('🔓 البوت مفتوح الآن.');
        return;
    }
});

// Start the bot
client.initialize();