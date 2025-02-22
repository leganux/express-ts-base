import { Router } from 'express';
import { validateFirebaseToken, AuthRequest } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';
import { Express } from 'express';

const router = Router();

/**
 * @swagger
 * /api/v1/email/send:
 *   post:
 *     tags:
 *       - Email
 *     summary: Send a simple email
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - content
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/send', 
  validateFirebaseToken,
  async (req: AuthRequest, res) => {
    try {
      const { to, subject, content, title } = req.body;
      const emailService = (req.app as Express).locals.emailService;

      if (!to || !subject || !content) {
        return res.status(400).json({
          error: 'Missing required fields',
          success: false,
          message: 'Please provide to, subject, and content',
          code: 400,
          data: {}
        });
      }

      await emailService.sendEmail({
        to,
        subject,
        context: {
          title: title || subject,
          content
        }
      });

      logger.info('Email sent:', {
        user: req.user?.uid,
        to,
        subject
      });

      res.json({
        error: null,
        success: true,
        message: 'Email sent successfully',
        code: 200,
        data: {}
      });
    } catch (error) {
      logger.error('Error sending email:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to send email',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/email/send-template:
 *   post:
 *     tags:
 *       - Email
 *     summary: Send an email using a template
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - templatePath
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               templatePath:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/send-template',
  validateFirebaseToken,
  async (req: AuthRequest, res) => {
    try {
      const { to, subject, templatePath, context } = req.body;
      const emailService = (req.app as Express).locals.emailService;

      if (!to || !subject || !templatePath) {
        return res.status(400).json({
          error: 'Missing required fields',
          success: false,
          message: 'Please provide to, subject, and templatePath',
          code: 400,
          data: {}
        });
      }

      // Load template
      const template = await emailService.loadTemplate(templatePath);

      await emailService.sendEmail({
        to,
        subject,
        template,
        context: {
          ...context,
          title: context.title || subject
        }
      });

      logger.info('Email sent with template:', {
        user: req.user?.uid,
        to,
        subject,
        template: templatePath
      });

      res.json({
        error: null,
        success: true,
        message: 'Email sent successfully',
        code: 200,
        data: {}
      });
    } catch (error) {
      logger.error('Error sending email with template:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to send email',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/email/send-with-attachment:
 *   post:
 *     tags:
 *       - Email
 *     summary: Send an email with attachments
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - content
 *               - attachments
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               title:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     path:
 *                       type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/send-with-attachment',
  validateFirebaseToken,
  async (req: AuthRequest, res) => {
    try {
      const { to, subject, content, title, attachments } = req.body;
      const emailService = (req.app as Express).locals.emailService;

      if (!to || !subject || !content || !attachments) {
        return res.status(400).json({
          error: 'Missing required fields',
          success: false,
          message: 'Please provide to, subject, content, and attachments',
          code: 400,
          data: {}
        });
      }

      await emailService.sendEmail({
        to,
        subject,
        context: {
          title: title || subject,
          content
        },
        attachments
      });

      logger.info('Email sent with attachments:', {
        user: req.user?.uid,
        to,
        subject,
        attachmentCount: attachments.length
      });

      res.json({
        error: null,
        success: true,
        message: 'Email sent successfully',
        code: 200,
        data: {}
      });
    } catch (error) {
      logger.error('Error sending email with attachments:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to send email',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  }
);

export default router;
