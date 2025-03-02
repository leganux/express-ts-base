import { Router } from 'express';
import { Server } from 'http';
import QRCode from 'qrcode';
import { WhatsAppChat } from './models/chat.model';

export default function whatsappRoutes(server?: Server) {
    const router = Router();

    // Get connection status and QR if needed
    router.get('/status', async (req, res) => {
        try {
            const whatsappService = req.app.locals.whatsappService;
            if (!whatsappService) {
                return res.status(503).json({ status: 'error', message: 'WhatsApp service not initialized' });
            }

            const state = await whatsappService.getState();


            // Return both state and QR code if available
            return res.json({
                status: state.connected ? 'connected' : 'disconnected',
                state: state.state
            });
        } catch (error) {
            console.error('Error in /status route:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    });

    // Get QR code as HTML page
    router.get('/qr', async (req, res) => {
        try {
            const whatsappService = req.app.locals.whatsappService;
            if (!whatsappService) {
                return res.status(503).send('WhatsApp service not initialized');
            }


            const qrDataUrl = await QRCode.toDataURL(whatsappService.getCurrentQR());
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp QR Code</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background-color: #f0f2f5;
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            text-align: center;
                            padding: 20px;
                            background: white;
                            border-radius: 10px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        h1 {
                            color: #128C7E;
                            margin-bottom: 20px;
                        }
                        img {
                            max-width: 300px;
                            height: auto;
                        }
                        p {
                            color: #666;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>WhatsApp QR Code</h1>
                        <img src="${qrDataUrl}" alt="WhatsApp QR Code">
                        <p>Scan this QR code with WhatsApp to connect</p>
                    </div>
                </body>
                </html>
            `);
        } catch (error) {
            console.error('Error in /qr route:', error);
            res.status(500).send('Error generating QR code');
        }
    });

    // Update chat name
    router.put('/chat/:jid/name', async (req, res) => {
        try {
            const whatsappService = req.app.locals.whatsappService;
            if (!whatsappService) {
                return res.status(503).json({ error: 'WhatsApp service not initialized' });
            }

            const { jid } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            await WhatsAppChat.findOneAndUpdate(
                { jid },
                { name },
                { upsert: true }
            );

            res.json({ success: true });
        } catch (error) {
            console.error('Error updating chat name:', error);
            res.status(500).json({ error: 'Failed to update chat name' });
        }
    });

    // Get all chats
    router.get('/chats', async (req, res) => {
        try {
            const whatsappService = req.app.locals.whatsappService;
            if (!whatsappService) {
                return res.status(503).json({ error: 'WhatsApp service not initialized' });
            }

            const chats = await whatsappService.getChats();
            res.json(chats);
        } catch (error) {
            console.error('Error in /chats route:', error);
            res.status(500).json({ error: 'Failed to get chats' });
        }
    });

    // Get messages from a specific chat
    router.get('/messages/:jid', async (req, res) => {
        try {
            const whatsappService = req.app.locals.whatsappService;
            if (!whatsappService) {
                return res.status(503).json({ error: 'WhatsApp service not initialized' });
            }

            const messages = await whatsappService.getMessages(req.params.jid);
            res.json(messages);
        } catch (error) {
            console.error('Error in /messages route:', error);
            res.status(500).json({ error: 'Failed to get messages' });
        }
    });

    // Send a message
    router.post('/send', async (req, res) => {
        try {
            const whatsappService = req.app.locals.whatsappService;
            if (!whatsappService) {
                return res.status(503).json({ error: 'WhatsApp service not initialized' });
            }

            const { to, content, type, mediaPath } = req.body;

            if (!to || !content) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            await whatsappService.sendMessage(to, content, type, mediaPath);
            res.json({ success: true });
        } catch (error) {
            console.error('Error in /send route:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    return router;
}
