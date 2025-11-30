const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { getEmailTransporter } = require('../config/email');
const config = require('../config');
const logger = require('../config/logger');
const { emailsSentTotal } = require('../utils/metrics');

class EmailService {
  constructor() {
    this.templates = new Map();
  }

  async loadTemplate(templateName) {
    try {
      if (this.templates.has(templateName)) {
        return this.templates.get(templateName);
      }

      const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);
      
      this.templates.set(templateName, compiled);
      return compiled;
    } catch (error) {
      logger.error(`Failed to load template ${templateName}:`, error);
      throw error;
    }
  }

  async sendEmail({ to, subject, template, data }) {
    try {
      const transporter = getEmailTransporter();
      
      if (!transporter) {
        throw new Error('Email transporter not configured');
      }

      // Load and compile template
      const compiledTemplate = await this.loadTemplate(template);
      const html = compiledTemplate(data);

      // Send email
      const info = await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html
      });

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId
      });

      emailsSentTotal.labels('success').inc();
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email:', error);
      emailsSentTotal.labels('failed').inc();
      return { success: false, error: error.message };
    }
  }

  async sendOrderConfirmation(to, orderData) {
    return this.sendEmail({
      to,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      template: 'order-confirmation',
      data: orderData
    });
  }

  async sendOrderShipped(to, orderData) {
    return this.sendEmail({
      to,
      subject: `Your Order Has Been Shipped - ${orderData.orderNumber}`,
      template: 'order-shipped',
      data: orderData
    });
  }

  async sendOrderDelivered(to, orderData) {
    return this.sendEmail({
      to,
      subject: `Your Order Has Been Delivered - ${orderData.orderNumber}`,
      template: 'order-delivered',
      data: orderData
    });
  }

  async sendPaymentConfirmation(to, paymentData) {
    return this.sendEmail({
      to,
      subject: 'Payment Confirmation',
      template: 'payment-confirmation',
      data: paymentData
    });
  }

  async sendWelcomeEmail(to, userData) {
    return this.sendEmail({
      to,
      subject: 'Welcome to OrderApp+',
      template: 'welcome',
      data: userData
    });
  }
}

module.exports = new EmailService();
