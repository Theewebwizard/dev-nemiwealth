const ConversationStateMachine = require('./conversationStateMachine');
const logger = require('../utils/logger');

// Create a single instance of ConversationStateMachine
const stateMachine = new ConversationStateMachine();

function handleMessageStatuses(statuses) {
  statuses.forEach(status => stateMachine.handleMessageStatus(status));
}

// Define the handleWebhook function
exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = JSON.parse(req.body.correctdata);
    const changes = webhookData.entry[0].changes[0].value;

    if (changes.statuses) {
      handleMessageStatuses(changes.statuses);
    }

    if (changes.messages) {
      await stateMachine.handleMessage(changes.messages[0], changes.contacts[0]);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
};