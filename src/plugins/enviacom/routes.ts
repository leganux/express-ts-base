import { Router } from 'express';
import { validateEnv } from '../../config/env.validator';
import EnviacomPlugin from './index';

const config = validateEnv();

export default function enviacomRoutes() {
    const router = Router();
    const enviacom = new EnviacomPlugin(config.ENVIACOM_API_KEY);

    // Get Shipping Rates
    router.post('/rates', async (req, res) => {
        try {
            const { origin, destination, packages } = req.body;
            const rates = await enviacom.getShippingRates(origin, destination, packages);
            res.json(rates);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get shipping rates' });
        }
    });

    // Create Shipment
    router.post('/shipments', async (req, res) => {
        try {
            const { origin, destination, packages, carrier, service } = req.body;
            const shipment = await enviacom.createShipment(
                origin,
                destination,
                packages,
                carrier,
                service
            );
            res.json(shipment);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create shipment' });
        }
    });

    // Track Shipment
    router.get('/tracking/:number', async (req, res) => {
        try {
            const tracking = await enviacom.trackShipment(req.params.number);
            res.json(tracking);
        } catch (error) {
            res.status(500).json({ error: 'Failed to track shipment' });
        }
    });

    // Get Available Carriers
    router.get('/carriers', async (req, res) => {
        try {
            const carriers = await enviacom.getCarriers();
            res.json(carriers);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get carriers' });
        }
    });

    // Generate Label
    router.get('/labels/:shipmentId', async (req, res) => {
        try {
            const label = await enviacom.generateLabel(req.params.shipmentId);
            res.json(label);
        } catch (error) {
            res.status(500).json({ error: 'Failed to generate label' });
        }
    });

    // Cancel Shipment
    router.delete('/shipments/:id', async (req, res) => {
        try {
            const result = await enviacom.cancelShipment(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to cancel shipment' });
        }
    });

    // Get Insurance Quote
    router.post('/insurance/quote', async (req, res) => {
        try {
            const { declaredValue, carrier } = req.body;
            const quote = await enviacom.getInsuranceQuote(declaredValue, carrier);
            res.json(quote);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get insurance quote' });
        }
    });

    // Get Pickup Availability
    router.post('/pickup/availability', async (req, res) => {
        try {
            const { address, carrier, date } = req.body;
            const availability = await enviacom.getPickupAvailability(
                address,
                carrier,
                date
            );
            res.json(availability);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get pickup availability' });
        }
    });

    // Schedule Pickup
    router.post('/pickup', async (req, res) => {
        try {
            const { address, carrier, date, timeWindow, shipmentIds } = req.body;
            const pickup = await enviacom.schedulePickup(
                address,
                carrier,
                date,
                timeWindow,
                shipmentIds
            );
            res.json(pickup);
        } catch (error) {
            res.status(500).json({ error: 'Failed to schedule pickup' });
        }
    });

    // Cancel Pickup
    router.delete('/pickup/:id', async (req, res) => {
        try {
            const result = await enviacom.cancelPickup(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to cancel pickup' });
        }
    });

    return router;
}
