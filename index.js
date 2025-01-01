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
const processedMessages = new Set();

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

app.post('/webhookdata', async (req, res) => { 
    try {
        const webhookData = JSON.parse(req.body.correctdata);
        const changes = webhookData.entry[0].changes[0].value;

        const statusOrder = {
            'sent': 1,
            'delivered': 2,
            'read': 3
        };
        
        // Track latest status per message
        const messageStatuses = new Map();
        
        if (changes.statuses) {
            const status = changes.statuses[0];
            const currentOrder = statusOrder[status.status.toLowerCase()];
            const latestStatus = messageStatuses.get(status.id);
            
            // Only process if new status has higher order
            if (!latestStatus || currentOrder > statusOrder[latestStatus.toLowerCase()]) {
                messageStatuses.set(status.id, status.status);
                const date = new Date(status.timestamp * 1000);
                console.log(`[${date.toISOString().replace('T', ' ').split('.')[0]}] Message ${status.id}: ${status.status.toUpperCase()}`);
            }
        }

        if (changes.messages) {
            const messageId = changes.messages[0].id;
            if (!processedMessages.has(messageId)) {
                processedMessages.add(messageId);
                setTimeout(() => processedMessages.delete(messageId), 60000);
                
                const message = changes.messages[0];
                const sender = changes.contacts[0].profile.name;
                
                if (message.type === 'button') {
                    console.log(`Button pressed by ${sender}: ${message.button.text}`);
                    if(message.button.text ==='start an SIP'){
                        try {
                            const response = await SendDocMessage('919399450169', 'documents_verification');
                            console.log('Message sent successfully:', response);
                        } catch (error) {
                            console.error('Error during initial message sending:', error.message);
                        }
                    }
                } else if (message.type === 'text') {
                    console.log(`Text from ${sender}: ${message.text.body}`);
                }
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







//--------------------------------------------------------------------------
const SendDocMessage = async (recipient, templateName = 'documents_verification') => {
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
                    language: { code: 'en' }, // Change to 'en' or 'en_US' based on template configuration
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    parameter_name: 'documen_tname',
                                    text: 'Aadhar', // Matches {{documen_tname}}
                                },
                            ],
                        },
                    ],
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
