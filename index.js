require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const ngrok = require('@ngrok/ngrok'); 

const app = express();
const PORT = process.env.PORT || 3000;

PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN;

const requiredEnvVars = ['PHONE_NUMBER_ID', 'WHATSAPP_TOKEN', 'NGROK_AUTH_TOKEN'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is not set!`);
    }
});

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

app.post('/webhookdata', (req, res) => { 
    try {
        const webhookData = JSON.parse(req.body.correctdata);
        const changes = webhookData.entry[0].changes[0].value;

        // Handle status updates
        if (changes.statuses) {
            const status = changes.statuses[0];
            console.log(`Message ${status.id}: ${status.status.toUpperCase()}`);
        }

        // Handle incoming messages
        if (changes.messages) {
            const message = changes.messages[0];
            const sender = changes.contacts[0].profile.name;
            
            if (message.type === 'button') {
                console.log(`Button pressed by ${sender}: ${message.button.text}`);

            } else if (message.type === 'text') {
                console.log(`Text from ${sender}: ${message.text.body}`);
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
