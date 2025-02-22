import { Router } from 'express';
import WhatsAppPlugin from './index';
import { Server } from 'http';
import QRCode from 'qrcode';

export default function whatsappRoutes(server: Server) {
    const router = Router();
    const whatsapp = new WhatsAppPlugin(server);

    // Initialize WhatsApp connection
    whatsapp.connect().catch(console.error);

    // Get QR code as HTML page
    router.get('/qr', async (_req, res) => {
        const qr = whatsapp.getCurrentQR();
        if (!qr) {
            return res.send('<h1>WhatsApp is already connected or QR not yet generated</h1>');
        }

        try {
            const qrDataUrl = await QRCode.toDataURL(qr);
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
            res.status(500).send('Error generating QR code');
        }
    });

    // Get QR code status and connection state
    router.get('/status', (_req, res) => {
        if (!whatsapp.isConnected()) {
            return res.status(503).json({ status: 'disconnected' });
        }
        res.json({ status: 'connected' });
    });

    // Get all chats
    router.get('/chats', async (_req, res) => {
        try {
            const chats = await whatsapp.getChats();
            res.json(chats);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get chats' });
        }
    });

    // Get messages from a specific chat
    router.get('/messages/:jid', async (req, res) => {
        try {
            const messages = await whatsapp.getMessages(req.params.jid);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get messages' });
        }
    });

    // Send a message
    router.post('/send', async (req, res) => {
        try {
            const { to, content, type, mediaPath } = req.body;
            
            if (!to || !content) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            await whatsapp.sendMessage(to, content, type, mediaPath);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    return router;
}
