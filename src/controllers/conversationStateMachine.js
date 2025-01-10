const { sendMessage, sendDocMessage, sendinvredMessage, confirmMessage } = require('../services/whatsappService');
const logger = require('../utils/logger');
const databaseService = require('../services/DatabaseService.js');
const conversationFlow = require('./conversationFlow.json');

class ConversationStateMachine {
  constructor() {
    this.flow = conversationFlow;
    this.processedMessages = new Map();
    this.userStates = new Map();
    this.userContext = new Map();
  }

  async handleMessage(message, contact) {
    const messageId = message.id;
    const userId = contact.wa_id; // Using WhatsApp ID as the unique identifier
    const sender = contact.profile.name;
    console.log(userId)
    if (this.processedMessages.has(messageId)) {
      logger.info(`Duplicate message ${messageId} for user ${userId}`);
      return;
    }

    this.processedMessages.set(messageId, 'processing');
    setTimeout(() => this.processedMessages.delete(messageId), 60000);

    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, 'INITIAL');
      this.userContext.set(userId, { operation: "", operation2: "" });
      logger.info(`New conversation started for user ${userId}`);
    }

    const currentState = this.userStates.get(userId);
    const context = this.userContext.get(userId);

    logger.info(`Processing message for user ${userId} in state ${currentState}`);
    await this.processState(currentState, message, userId, context,sender);
  }

  async processState(currentState, message, userId, context,sender) {
    const stateConfig = this.flow.states[currentState];
    const transitionEvent = this.determineTransitionEvent(message, stateConfig.validationRules);

    if (!transitionEvent) {
      logger.warn(`Invalid message for state ${currentState} from user ${userId}`);
      return;
    }

    const transition = stateConfig.transitions[transitionEvent];
    
    try {
      logger.info(`Executing action ${transition.action} for user ${userId}`);
      await this.executeAction(transition.action, userId, transition.params, message, context);

      if (transition.contextUpdates) {
        Object.assign(context, transition.contextUpdates);
        logger.info(`Updated context for user ${userId}: ${JSON.stringify(context)}`);
      }

      if (transition.saveToDatabase) {
        await this.saveToDatabase(userId, message, context, sender);
      }

      this.userStates.set(userId, transition.nextState);
      logger.info(`State transition for user ${userId}: ${currentState} -> ${transition.nextState}`);
    } catch (error) {
      logger.error(`Error in state transition for user ${userId}: ${error.message}`);
    }
  }

  determineTransitionEvent(message, validationRules) {
    for (const [event, rules] of Object.entries(validationRules)) {
      if (this.validateMessage(message, rules)) {
        return event;
      }
    }
    return null;
  }

  validateMessage(message, rules) {
    if (message.type !== rules.type) return false;

    switch (rules.type) {
      case 'text':
        if (rules.matches) {
          return rules.matches.some(keyword => 
            message.text.body.toLowerCase().includes(keyword)
          );
        }
        if (rules.isNumber) {
          return !isNaN(Number(message.text.body)) && isFinite(message.text.body);
        }
        return true;

      case 'button':
        return message.button && message.button.text === rules.text;

      default:
        return false;
    }
  }

  async executeAction(actionName, userId, params, message, context) {
    const actions = {
      sendMessage: async () => await sendMessage(userId, params.template),
      sendDocMessage: async () => await sendDocMessage(userId, params.template),
      sendinvredMessage: async () => await sendinvredMessage(userId, params.template),
      confirmMessage: async () => await confirmMessage(
        userId, 
        params.template, 
        context.operation, 
        Number(message.text.body)
      )
    };

    const action = actions[actionName];
    if (!action) {
      throw new Error(`Unknown action: ${actionName}`);
    }

    return await action();
  }

  async saveToDatabase(userId, message, context, sender) {
    try {
      const userData = {
        phoneNumber: 919399450169,
        name: sender,
        createdAt: new Date(),
        action: context.operation,
        "sub-action2": context.operation2,
        amount: Number(message.text.body)
      };
      await databaseService.createUser(userData);
      logger.info(`User data saved to database for user ${userId}`);
    } catch (error) {
      logger.error(`Error saving user data to database for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  handleMessageStatus(status) {
    const statusOrder = { 'sent': 1, 'delivered': 2, 'read': 3 };
    const currentOrder = statusOrder[status.status.toLowerCase()];
    const latestStatus = this.processedMessages.get(status.id);
    
    if (!latestStatus || currentOrder > statusOrder[latestStatus.toLowerCase()]) {
      this.processedMessages.set(status.id, status.status);
      logger.info(`Message ${status.id}: ${status.status.toUpperCase()}`);
    }
  }
}

const stateMachine = new ConversationStateMachine();

// Webhook handler
exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = JSON.parse(req.body.correctdata);
    const changes = webhookData.entry[0].changes[0].value;

    if (changes.statuses) {
      changes.statuses.forEach(status => stateMachine.handleMessageStatus(status));
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

module.exports = ConversationStateMachine;