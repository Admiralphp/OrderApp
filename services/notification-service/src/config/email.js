const nodemailer = require('nodemailer');
const config = require('./index');
const logger = require('./logger');

let transporter = null;

const initializeEmailTransporter = () => {
  try {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });

    logger.info('Email transporter initialized');
    return transporter;
  } catch (error) {
    logger.error('Failed to initialize email transporter:', error);
    return null;
  }
};

const getEmailTransporter = () => {
  if (!transporter) {
    transporter = initializeEmailTransporter();
  }
  return transporter;
};

const verifyEmailConnection = async () => {
  try {
    const transport = getEmailTransporter();
    if (!transport) {
      return false;
    }

    await transport.verify();
    logger.info('Email server connection verified');
    return true;
  } catch (error) {
    logger.error('Email server verification failed:', error);
    return false;
  }
};

module.exports = {
  initializeEmailTransporter,
  getEmailTransporter,
  verifyEmailConnection
};
