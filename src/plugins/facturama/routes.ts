import { Router, Response } from 'express';
import { validateFirebaseToken, AuthRequest } from '../../middleware/auth.middleware';
import { FacturamaService } from './services/facturama.service';
import { logger } from '../../utils/logger';

const router = Router();

export default (app: any) => {
    const facturamaService: FacturamaService = app.locals.facturamaService;

    // Get Facturama catalogs
    router.get('/catalogs', validateFirebaseToken, async (req: AuthRequest, res: Response) => {
        try {
            const catalogs = await facturamaService.getCatalogs();
            res.json(catalogs);
        } catch (error) {
            logger.error('Error getting catalogs:', error);
            res.status(500).json({ error: 'Failed to get catalogs' });
        }
    });

    // Create invoice from order
    router.post('/invoices/order/:orderId', validateFirebaseToken, async (req: AuthRequest, res: Response) => {
        try {
            const { orderId } = req.params;
            const invoice = await facturamaService.createInvoice(orderId);
            res.json(invoice);
        } catch (error) {
            logger.error('Error creating invoice:', error);
            res.status(500).json({ error: 'Failed to create invoice' });
        }
    });

    // Cancel invoice
    router.delete('/invoices/:invoiceId', validateFirebaseToken, async (req: AuthRequest, res: Response) => {
        try {
            const { invoiceId } = req.params;
            await facturamaService.cancelInvoice(invoiceId);
            res.json({ message: 'Invoice cancelled successfully' });
        } catch (error) {
            logger.error('Error cancelling invoice:', error);
            res.status(500).json({ error: 'Failed to cancel invoice' });
        }
    });

    // Get single invoice
    router.get('/invoices/:invoiceId', validateFirebaseToken, async (req: AuthRequest, res: Response) => {
        try {
            const { invoiceId } = req.params;
            const invoice = await facturamaService.getInvoice(invoiceId);
            res.json(invoice);
        } catch (error) {
            logger.error('Error getting invoice:', error);
            res.status(500).json({ error: 'Failed to get invoice' });
        }
    });

    // List invoices (optionally filtered by user)
    router.get('/invoices', validateFirebaseToken, async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.query.userId as string;
            const invoices = await facturamaService.listInvoices(userId);
            res.json(invoices);
        } catch (error) {
            logger.error('Error listing invoices:', error);
            res.status(500).json({ error: 'Failed to list invoices' });
        }
    });

    return router;
};
