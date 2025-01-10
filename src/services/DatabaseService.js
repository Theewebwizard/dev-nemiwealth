const axios = require('axios');
const logger = require('../utils/logger');

const DATABASE_API_URL = process.env.DATABASE_API_URL || 'http://localhost:3000/api'; //please check this out

const databaseService = {
  createUser: async (userData) => {
    try {
      const response = await axios.post(`${DATABASE_API_URL}/users`, userData);
      logger.info('User data sent to database successfully');
      return response.data;
    } catch (error) {
      logger.error('Error sending user data to database:', error.message);
      throw error;
    }
  },

  createMessage: async (messageData) => {
    try {
      const response = await axios.post(`${DATABASE_API_URL}/messages`, messageData);
      logger.info('Message data sent to database successfully');
      return response.data;
    } catch (error) {
      logger.error('Error sending message data to database:', error.message);
      throw error;
    }
  },

  updateUser: async (info) => {
    try { //
      const response = await axios.put(`${DATABASE_API_URL}/users/:phoneNumber`, info);
      logger.info('User data updated in database successfully');
      return response.data;
    } catch (error) {
      logger.error('Error updating user data in database:', error.message);
      throw error;
    }
  },
  
  findUser: async (phoneNumber) => {
    try {
      const response = await axios.get(`${DATABASE_API_URL}/users/${phoneNumber}`);
      logger.info('User data retrieved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error retrieving user data from database:', error.message);
      throw error;
    }
  }
  
};

module.exports = databaseService;