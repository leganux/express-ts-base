import { Router } from 'express';
import { validateEnv } from '../../config/env.validator';
import SkydropxPlugin from './index';

const config = validateEnv();

export default function skydropxRoutes() {
    const router = Router();
    const skydropx = new SkydropxPlugin(config.SKYDROPX_API_KEY);

    // Create Shipment
    router.post('/shipments', async (req, res) => {
        try {
            const { fromAddress, toAddress, parcel, consignmentNote } = req.body;
            const shipment = await skydropx.createShipment(
                fromAddress,
                toAddress,
                parcel,
                consignmentNote
            );
            res.json(shipment);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create shipment' });
        }
    });

    // Get Shipping Rates
    router.get('/shipments/:id/rates', async (req, res) => {
        try {
            const rates = await skydropx.getShippingRates(req.params.id);
            res.json(rates);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get shipping rates' });
        }
    });

    // Create Label
    router.post('/labels', async (req, res) => {
        try {
            const { rateId } = req.body;
            const label = await skydropx.createLabel(rateId);
            res.json(label);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create label' });
        }
    });

    // Track Shipment
    router.get('/tracking/:number', async (req, res) => {
        try {
            const tracking = await skydropx.trackShipment(req.params.number);
            res.json(tracking);
        } catch (error) {
            res.status(500).json({ error: 'Failed to track shipment' });
        }
    });

    // Get Available Carriers
    router.get('/carriers', async (req, res) => {
        try {
            const carriers = await skydropx.getCarriers();
            res.json(carriers);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get carriers' });
        }
    });

    // Cancel Shipment
    router.delete('/shipments/:id', async (req, res) => {
        try {
            const result = await skydropx.cancelShipment(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to cancel shipment' });
        }
    });

    // Get Shipment Details
    router.get('/shipments/:id', async (req, res) => {
        try {
            const shipment = await skydropx.getShipment(req.params.id);
            res.json(shipment);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get shipment details' });
        }
    });

    // Get Label Status
    router.get('/labels/:id', async (req, res) => {
        try {
            const status = await skydropx.getLabelStatus(req.params.id);
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get label status' });
        }
    });

    return router;
}
