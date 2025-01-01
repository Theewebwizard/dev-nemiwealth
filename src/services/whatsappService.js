const axios = require('axios');
const { PHONE_NUMBER_ID, WHATSAPP_TOKEN } = require('../config/env');
const logger = require('../utils/logger');

const sendMessage = async (recipient, templateName = 'wishing_hello') => {
  if (!recipient || !templateName) {
    throw new Error('Recipient and templateName are required!');
  }

  const apiUrl = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios({
      url: apiUrl,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
        },
      },
    });

    logger.info(`Message sent to ${recipient} with template ${templateName}`);
    return response.data;
  } catch (error) {
    logger.error('Error sending message:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send message');
  }
};

const sendDocMessage = async (recipient, templateName = 'documents_verification') => {
  if (!recipient || !templateName) {
    throw new Error('Recipient and templateName are required!');
  }

  const apiUrl = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios({
      url: apiUrl,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  parameter_name: 'documen_tname',
                  text: 'Aadhar',
                },
              ],
            },
          ],
        },
      },
    });

    logger.info(`Document verification message sent to ${recipient}`);
    return response.data;
  } catch (error) {
    logger.error('Error sending document verification message:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send document verification message');
  }
};

module.exports = {
  sendMessage,
  sendDocMessage,
};