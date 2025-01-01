require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ngrok = require('@ngrok/ngrok');
const { PORT } = require('./src/config/env');
const webhookRoutes = require('./src/routes/webhookRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(bodyParser.json());
app.use('/webhook', webhookRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
