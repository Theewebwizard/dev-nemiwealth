const { sendMessage, sendDocMessage } = require('../services/whatsappService');
const logger = require('../utils/logger');

const processedMessages = new Set();

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
      if (message.button.text === 'start an SIP') {
        try {
          const response = await sendDocMessage('919399450169', 'documents_verification');
          logger.info('Document verification message sent successfully:', response);
        } catch (error) {
          logger.error('Error sending document verification message:', error.message);
        }
      }
    } else if (message.type === 'text') {
      logger.info(`Text from ${sender}: ${message.text.body}`);
      if(message.text.body === 'hi'){
        await sendMessage('919399450169', 'wishing_hello');
        logger.info('Hello message sent successfully');
      }
    }
  }
}