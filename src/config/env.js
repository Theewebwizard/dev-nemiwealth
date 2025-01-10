const requiredEnvVars = ['PHONE_NUMBER_ID', 'WHATSAPP_TOKEN', 'NGROK_AUTH_TOKEN', 'PORT'];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Environment variable ${varName} is not set!`);
  }
});

module.exports = {
  PORT: process.env.PORT || 3000,
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  NGROK_AUTH_TOKEN: process.env.NGROK_AUTH_TOKEN,
};