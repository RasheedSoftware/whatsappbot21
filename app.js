const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const express = require('express');
const qrcode = require('qrcode-terminal');
const app = express();

const PORT = process.env.PORT || 4000;

const {
    addBlockedWord,
    removeBlockedWord,
    addHelpRequest,
    removeHelpRequest,
    loadBlockedWords,
    loadHelpRequests,
    loadHelpRequest1,
    isSimilarMessage,
    blockedWords,
    helpRequests,
    helpRequests1,
    showBlockedWords,
    blockedcontact,
    loadBlockedcontact,
    addBlockedContact,
    addHelpRequest1,
    saveHelpRequests1,
} = require('./wordManager');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('Scan the QR code to log in.');
        }
        if (connection === "open") {
            console.log("✅ Bot is ready and connected to WhatsApp!");
        } else if (connection === "close") {
            console.log("❌ Connection lost, reconnecting...");
            startBot();
        }
    });

    loadBlockedWords();
    loadBlockedcontact();
    loadHelpRequests();
    loadHelpRequest1();

    let isLocked = false;

    async function isAdmin(chat, userId) {
        try {
            const metadata = await sock.groupMetadata(chat);
            return metadata.participants.some(p => p.id === userId && (p.admin === "admin" || p.admin === "superadmin"));
        } catch (error) {
            console.error("Error checking admin status:", error);
            return false;
        }
    }

    function isMessageBlocked(message) {
        return blockedWords.some(word => message.includes(word));
    }

    async function handleBlockedMessage(msg, senderId) {
        const chat = msg.key.remoteJid;
        if (await isAdmin(chat, senderId)) {
            console.log("🔒 Cannot take action against an admin.");
            return;
        }

        await sock.sendMessage(chat, { delete: msg.key });
        const metadata = await sock.groupMetadata(chat);

        if (metadata && metadata.participants.some(p => p.id === senderId)) {
            await sock.groupParticipantsUpdate(chat, [senderId], "remove");
            console.log(`🚫 Removed ${senderId} from the group.`);
        }
    }

    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || !msg.key.remoteJid) return;

            const senderId = msg.key.participant || msg.key.remoteJid;
            const chat = msg.key.remoteJid;
            const messageBody = msg.message.conversation || "";
            const isGroup = chat.endsWith("@g.us");

            if (isGroup) {
                const metadata = await sock.groupMetadata(chat);
                const groupName = metadata.subject;

                if (isSimilarMessage(messageBody, 0.52)) {
                    console.log(`📋 ${senderId} in group: ${groupName}`);
                    const blockData = {
                        username: senderId,
                        phoneNumber: senderId,
                        message: messageBody,
                        timestamp: new Date().toISOString()
                    };
                    addBlockedWord(blockData);
                }

                if (await isAdmin(chat, senderId)) {
                    console.log("🔒 Cannot take action against an admin.");
                } else if (['برمجه غرضيه موجه ه(عام)', 'استفسارات الجامعة خالد عام.', 'MyBottry','addrequest', 'MyBottry1', 'ExpBot', 'group123'].includes(groupName)) {
                    if (isMessageBlocked(messageBody)) {
                        await handleBlockedMessage(msg, senderId);
                    }
                }

                const [command, ...rest] = messageBody.split(' ');
                const word = rest.join(' ');

                if (command === '!addword1122') {
                    const wordToAdd = word.trim();
                    addBlockedWord({ username: senderId, phoneNumber: senderId, message: wordToAdd, timestamp: new Date().toISOString() });
                    await sock.sendMessage(chat, { text: `✅ Added blocked word: "${wordToAdd}"` });
                    return;
                }

                if (command === '!removeword1122') {
                    const wordToRemove = word.trim();
                    if (wordToRemove) {
                        removeBlockedWord(wordToRemove);
                        await sock.sendMessage(chat, { text: `✅ Removed blocked word: "${wordToRemove}"` });
                    }
                    return;
                }

                if (command === '!showwords1122') {
                    const wordsList = showBlockedWords();
                    await sock.sendMessage(chat, { text: `📋 Current blocked words:\n${blockedWords.join(', ')}` });
                    return;
                }

                if (command === '!span' && await isAdmin(chat, senderId)) {
                    const wordToSpan = word.trim();
                    if (wordToSpan) {
                        await handleBlockedMessage(msg, senderId);
                        await sock.sendMessage(chat, { text: `✅ Span command executed by admin.` });
                    }
                    return;
                }

                if (command === '!lock1122' && await isAdmin(chat, senderId)) {
                    isLocked = true;
                    await sock.sendMessage(chat, { text: '🔒 Bot is now locked.' });
                    return;
                }

                if (command === '!unlock1122' && await isAdmin(chat, senderId)) {
                    isLocked = false;
                    await sock.sendMessage(chat, { text: '🔓 Bot is now unlocked.' });
                    return;
                }
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    });
}

startBot();

// Express server setup
app.get('/', (req, res) => {
    res.send('مرحبا بكم في التطبيق!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
