import nodemailer, { Transporter } from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { validateEnv } from '../config/env.validator';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

const config = validateEnv();

// Base email template
const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
      margin-bottom: 20px;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      margin-top: 20px;
      color: #666;
      font-size: 0.9em;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{title}}</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>© {{year}} Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

class EmailService {
  private sesClient: SESClient | null;
  private smtpTransporter: Transporter | null;

  constructor() {
    // Initialize SES client if using AWS SES
    this.sesClient = config.EMAIL_SERVICE === 'ses' ? new SESClient({
      region: config.AWS_SES_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY
      }
    }) : null;

    // Initialize SMTP transporter if using SMTP
    this.smtpTransporter = config.EMAIL_SERVICE === 'smtp' ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    }) : null;
  }

  // Send email using configured service
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Prepare email content
      const html = await this.renderTemplate(options.template || baseTemplate, {
        year: new Date().getFullYear(),
        ...options.context
      });

      if (config.EMAIL_SERVICE === 'ses') {
        await this.sendWithSES({
          ...options,
          html
        });
      } else {
        await this.sendWithSMTP({
          ...options,
          html
        });
      }

      logger.info('Email sent successfully:', {
        to: options.to,
        subject: options.subject
      });
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  // Load template from file
  async loadTemplate(templatePath: string): Promise<string> {
    try {
      const fullPath = path.join(__dirname, '..', 'templates', templatePath);
      return await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      logger.error('Error loading email template:', error);
      throw error;
    }
  }

  private async sendWithSES(options: EmailOptions & { html: string }): Promise<void> {
    if (!this.sesClient) throw new Error('SES client not initialized');

    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: Array.isArray(options.to) ? options.to : [options.to]
      },
      Message: {
        Body: {
          Html: {
            Data: options.html
          }
        },
        Subject: {
          Data: options.subject
        }
      },
      Source: config.EMAIL_FROM
    });

    await this.sesClient.send(command);
  }

  private async sendWithSMTP(options: EmailOptions & { html: string }): Promise<void> {
    if (!this.smtpTransporter) throw new Error('SMTP transporter not initialized');

    await this.smtpTransporter.sendMail({
      from: config.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments
    });
  }

  private async renderTemplate(template: string, context: Record<string, any>): Promise<string> {
    let html = template;
    
    // Replace all placeholders with context values
    Object.entries(context).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    });

    return html;
  }
}

export const emailService = new EmailService();
