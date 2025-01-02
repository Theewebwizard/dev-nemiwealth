const { sendMessage, sendDocMessage,sendinvredMessage } = require('../services/whatsappService');
const logger = require('../utils/logger');

const processedMessages = new Set();
let meow = 0;
exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = JSON.parse(req.body.correctdata);
    const changes = webhookData.entry[0].changes[0].value;

    if (changes.statuses) {
      handleMessageStatuses(changes.statuses);
    }

    if (changes.messages) {
      await handleIncomingMessages(changes.messages, changes.contacts);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
};

function handleMessageStatuses(statuses) {
  const statusOrder = { 'sent': 1, 'delivered': 2, 'read': 3 };
  const messageStatuses = new Map();

  statuses.forEach(status => {
    const currentOrder = statusOrder[status.status.toLowerCase()];
    const latestStatus = messageStatuses.get(status.id);
    
    if (!latestStatus || currentOrder > statusOrder[latestStatus.toLowerCase()]) {
      messageStatuses.set(status.id, status.status);
      logger.info(`Message ${status.id}: ${status.status.toUpperCase()}`);
    }
  });
}

async function handleIncomingMessages(messages, contacts) {
  const message = messages[0];
  const messageId = message.id;

  if (!processedMessages.has(messageId)) {
    processedMessages.add(messageId);
    setTimeout(() => processedMessages.delete(messageId), 60000);

    const sender = contacts[0].profile.name;

    if (message.type === 'button') {
      logger.info(`Button pressed by ${sender}: ${message.button.text}`);
       //step 2 sip or lumpsum
      if (message.button.text === 'Invest') {
        try {
          const response = await sendMessage('919399450169', 'wishing_hello');
          logger.info('Document verification message sent successfully:', response);
        } catch (error) {
          logger.error('Error sending document verification message:', error.message);
        }
      }
        //how much money would you like to invest
      if (message.button.text === 'start an SIP') { //after asking for money we will put this in debas asked
        try {
          const response = await sendDocMessage('919399450169', 'documents_verification');
          logger.info('Document verification message sent successfully:', response);
        } catch (error) {
          logger.error('Error sending document verification message:', error.message);
        }
      }
      


    } 
    
    else if (message.type === 'text') {
      logger.info(`Text from ${sender}: ${message.text.body}`);
      if(message.text.body.toLowerCase() === 'hi'){
        //step 1 invest or take out
        await sendinvredMessage('919399450169', 'invest');
        logger.info('asking for investment sent sucesfully message sent successfully');
      }
      if(Number.isInteger(Number(message.text.body))){
        meow = message.text.body;
        console.log("Meow:", meow);
      } 

    }
  }
}