require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Function to Send WhatsApp Message
const sendMessage = async (recipient, templateName = 'wishing_hello') => {
    if (!recipient || !templateName) {
        throw new Error('Recipient and templateName are required!');
    }

    const apiUrl = `https://graph.facebook.com/v21.0/${process.env.PHONE_NUMBER_ID}/messages`;

    try {
        const response = await axios({
            url: apiUrl,
            method: 'post',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
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

        console.log(`Message sent to ${recipient} with template ${templateName}`);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to send message');
    }
};

app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';
    
    // Parse the query params
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
  
    // Validate the request
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook validation successful!');
      res.status(200).send(challenge);
    } else {
      console.error('Webhook validation failed!');
      res.status(403).send('Forbidden');
    }
  });
  
  // Webhook for Receiving Messages (POST)
  app.post('/webhook', (req, res) => {
    try {
      const body = req.body;
  
      // Log incoming webhook
      console.log('Incoming webhook:', JSON.stringify(body, null, 2));
  
      // Check for messages in the webhook event
      if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const message = body.entry[0].changes[0].value.messages[0];
        const sender = message.from; // Sender's phone number
        const text = message.text?.body; // Message text content
  
        console.log(`Received a message from ${sender}: ${text}`);
  
        // Process the message (you can respond based on its content)
        // For example:
        if (text.toLowerCase().includes('sip')) {
          console.log('User wants to do sip');
        }
      } else {
        console.log('No messages found in the webhook event.');
      }
  
      // Respond to WhatsApp API to acknowledge the webhook
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Error processing webhook:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });







// Start Server and Send a Message
(async () => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    try {
        const response = await sendMessage('919399450169', 'wishing_hello');
        console.log('Message sent successfully:', response);
    } catch (error) {
        console.error('Error during initial message sending:', error.message);
    }
})();
