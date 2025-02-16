
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// const stringSimilarity = require('string-similarity');
//  const isSimilarMessage= require('./checksimilarity');
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

// Display QR code in the termi nal for authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code to log in.');
});

// Confirm bot is ready
client.on('ready', () => {
    console.log('✅ Bot is ready and connected to WhatsApp!');
});

// Load words
// let blockedWords = loadBlockedWords();
// let helpRequests = loadHelpRequests();
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

// وظيفة لجلب القروبات المشتركة مع المستخدم
async function getSharedGroups(senderId) {
    const chats = await client.getChats();
    const groupChats = chats.filter(chat => chat.isGroup); // جلب القروبات فقط

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
    const participant = message.author; // الرقم المرسل

    const warningMessage = 'تحذير: تم إرسال رسالة مزعجة أو تحتوي على كلمات محظورة.';
    await message.reply(warningMessage);


    let data = {
        name: message.name,
        phoneNumber: message.phoneNumber,
        message: msg.body, // الرسالة التي تلقيتها
        typeDevice: message.typeDevice, // يمكنك تغييره حسب الحاجة
        timestamp: new Date().toISOString() // استخدام التاريخ والوقت الحالي
    };

    await message.delete(true); // true للحذف الفوري

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
      //  console.log(contact);
      /**/
        if (chat.isGroup ) {
         //   if (chat.isGroup && (chat.name === 'MyBottry' ||chat.name==='group123')) {
                const senderId = msg.author; // ID of the sender
            const about = await contact.about || "no about info";
            // const newsstatus=await contact.getStatus() ;
            const newsstatus=await contact.status ||  "unknow";
          //  const commonGroups= await contact.getCommonGroups(chat.id);

const typeDevice =msg.typeDevice;
const sharedGroups = await getSharedGroups(senderId);
//console.log(`📋 ${senderId} is in the following shared groups:`, sharedGroups);
//await msg.reply(`📊 المستخدم مشترك في القروبات المشتركة التالية:\n${sharedGroups.join('\n')}\n📈 العدد الإجمالي:` ${sharedGroups.length});
            // Check if the sender is an admin
            // if (await isAdmin(chat, senderId)) {
            //     console.log("🔒 Cannot take action against an admin.");
            //     return; // Exit if the sender is an admin
            // }

            // Check for spam conditions
            const isSpam = msg.body.includes("spam") || msg.body.includes("unwanted");
//

// Process incoming message
const restss = msg.body.split(' ');
const wordss= restss.join(' ');
console.log(`before if isSimilarMessage`);
const wordToAddss = wordss.trim();

try {
   if (isSimilarMessage(wordToAddss, 0.45)) {
console.log(`📋 ${senderId} is in the following shared groups:`, sharedGroups);

    const sharedgroup=await  
       console.log(`after if isSimilarMessage`);
       let dataIfonBlock = {
           username: contact.pushname || "Unnamed",
           phoneNumber: senderId,
           message: wordToAddss,
           typeDevice: msg.deviceType || "Uutype",
           newsstatus: newsstatus ||  "unknow",
           about: about,
        //   commongroups:commonGroups,
           contactType: contact.isBusiness ? "Business" : "Regular",
           sharedGroups:sharedGroups.length,
           timestamp: new Date().toISOString()
       };
       addBlockedWord(dataIfonBlock);
      // msg.reply('aaaaaaaaaaaaaa');
   }
} catch (error) {
   console.error("Error in processing message:", error);
}
/*
            if (isSpam) {
                await msg.delete(true);
                chat.sendMessage(`🚨 *@${senderId}* was removed for violating group rules by sending spam.`);
                await chat.removeParticipants([senderId]);
                console.log(`User removed: ${senderId}`);
            } else if (isMessageBlocked(msg.body)) {
                await handleBlockedMessage(msg);
            }
*/
            // Command handling
          //  const [command, category, word] = msg.body.split(' ');

            const [command, category, ...rest] = msg.body.split(' ');
            const word = rest.join(' '); // Join the rest for cases where the word has spaces
            if (msg.body.startsWith('!addword11 ')) {
                let dataIfonBlock = {
                    username:  contact.pushname  || "Unnamed" , // التحقق من وجود msg.sender
                    phoneNumber: senderId, // تأكد من أن senderId مُعرفة بشكل صحيح
                    message: word, // تأكد من أن word مُعرفة بشكل صحيح
                    typeDevice: msg.deviceType || "Uutype", // تأكد من استخدام msg بدلاً من mes
                    //newsstatus: contact.getStatus() ||  "unknow",
                    newsstatus: newsstatus ||  "unknow",
                    about: about,
                //    commongroups:commonGroups,
                    contactType: contact.isBusiness ? "Business" : "Regular" ,// تحديد نوع الاتصال
                    sharedGroups:sharedGroups.length,
                    timestamp: new Date().toISOString() // استخدام التاريخ والوقت الحالي
                };
                const wordToAdd = word.trim();
                if (wordToAdd) {
                   // addBlockedWord(wordToAdd);
                    addBlockedWord(dataIfonBlock);
                 //   msg.reply(`✅  \nتمت إضافة الكلمة المحظورة: type phone \n "${typeDevice || "unknow"}" \n "${wordToAdd}" `);
  // بناء نص الرسالة لطباعة كل عنصر
  let responseMessage = `✅\nتمت إضافة الكلمة المحظورة:\n`;
  for (const [key, value] of Object.entries(dataIfonBlock)) {
      responseMessage += `  ${key}: "${value}"\n`;
  }

  // إرسال الرد مع تفاصيل الكائن
 // msg.reply(responseMessage);
                } else {
                //    msg.reply('🚫 يجب تقديم كلمة لإضافتها.');
                }
                return;
            }
    
            
            if (msg.body.startsWith('!removeword11 ')) {
                const wordToRemove = word.trim();
                if (wordToRemove) {
                    removeBlockedWord(wordToRemove);
                    msg.reply(`✅ تمت إزالة الكلمة المحظورة: "${wordToRemove}"`);
                } else {
                    msg.reply('🚫 يجب تقديم كلمة لإزالتها.');
                }
                return;
            }

        
            if (msg.body === '!showwords11') {
                showBlockedWords();
                msg.reply(`📋 الكلمات المحظورة الحالية:\n${blockedWords.join(', ')}`);
                return;
            }

            if (msg. body.startsWith('!addrequest11 ')) {
                addHelpRequest(category, word);
                msg.reply(`✅ تمت إضافة الكلمة "${word}" إلى فئة "${category}".`);
                return;
            }

            if (msg.body === '!showrequests11') {
                let response = '📋 الكلمات الحالية لكل فئة:\n';
                for (const cat in helpRequests) {
                    response += `\n*${cat}:* ${helpRequests[cat].join(', ')}`;
                }
                msg.reply(response);
                return;
            }

            if (msg.body === '!lock11') {
                isLocked = true;
                msg.reply('🔒 البوت مغلق الآن.');
                return;
            }

            if (msg.body === '!unlock11') {
                isLocked = false;
                msg.reply('🔓 البوت مفتوح الآن.');
                return;
            }
        }
    } catch (error) {
        console.error("Error handling message:", error);
    }
});

// Start the bot
client.initialize();

