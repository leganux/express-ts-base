import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { EnviaShipment } from './models/shipment.model';
import { EnviaPickup } from './models/pickup.model';
import { EnviaTrackingUpdate } from './models/tracking.model';

export interface EnviaAddress {
    name: string;
    company?: string;
    email: string;
    phone: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    reference?: string;
}

export interface EnviaPackage {
    content: string;
    amount: number;
    type: string;
    weight: number;
    insurance?: number;
    declaredValue?: number;
    weightUnit: 'kg' | 'lb';
    lengthUnit: 'cm' | 'in';
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
}

import { Express } from 'express';
import { IPlugin } from '../../types/plugin';

export class EnviacomPlugin implements IPlugin {
    private client!: AxiosInstance;
    private readonly baseURL = 'https://api.envia.com/ship/v1';
    
    name = 'enviacom';
    version = '1.0.0';

    constructor(private apiKey?: string) {
        if (apiKey) {
            this.initializeClient(apiKey);
        }
    }

    private initializeClient(apiKey: string) {
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async initialize(app: Express): Promise<void> {
        if (!this.apiKey) {
            throw new Error('API key is required for Enviacom plugin');
        }
        this.initializeClient(this.apiKey);
        logger.info('Enviacom plugin initialized successfully');
    }

    // Get Shipping Rates
    async getShippingRates(
        origin: EnviaAddress,
        destination: EnviaAddress,
        packages: EnviaPackage[]
    ) {
        try {
            const response = await this.client.post('/rate', {
                origin,
                destination,
                packages
            });
            logger.info('Shipping rates retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error getting shipping rates:', error);
            throw error;
        }
    }

    // Create Shipment
    async createShipment(
        origin: EnviaAddress,
        destination: EnviaAddress,
        packages: EnviaPackage[],
        carrier: string,
        service: string
    ) {
        try {
            const response = await this.client.post('/ship', {
                origin,
                destination,
                packages,
                carrier,
                service
            });
            
            // Store shipment in database
            const shipmentData = {
                shipmentId: response.data.shipmentId,
                origin,
                destination,
                packages,
                carrier,
                service,
                status: response.data.status,
                trackingNumber: response.data.trackingNumber,
                labelUrl: response.data.labelUrl,
                cost: response.data.cost,
                currency: response.data.currency
            };
            
            await EnviaShipment.create(shipmentData);
            
            logger.info('Shipment created:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error creating shipment:', error);
            throw error;
        }
    }

    // Track Shipment
    async trackShipment(trackingNumber: string) {
        try {
            const response = await this.client.get(`/track/${trackingNumber}`);
            
            // Store tracking update
            const trackingData = {
                shipmentId: response.data.shipmentId,
                trackingNumber,
                status: response.data.status,
                location: response.data.location,
                description: response.data.description,
                timestamp: new Date(response.data.timestamp),
                carrier: response.data.carrier
            };
            
            await EnviaTrackingUpdate.create(trackingData);
            
            // Update shipment status
            await EnviaShipment.findOneAndUpdate(
                { trackingNumber },
                { status: response.data.status }
            );
            
            logger.info('Tracking info retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error tracking shipment:', error);
            throw error;
        }
    }

    // Get Available Carriers
    async getCarriers() {
        try {
            const response = await this.client.get('/carriers');
            logger.info('Carriers retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error getting carriers:', error);
            throw error;
        }
    }

    // Generate Label
    async generateLabel(shipmentId: string) {
        try {
            const response = await this.client.get(`/label/${shipmentId}`);
            logger.info('Label generated:', { shipmentId });
            return response.data;
        } catch (error) {
            logger.error('Error generating label:', error);
            throw error;
        }
    }

    // Cancel Shipment
    async cancelShipment(shipmentId: string) {
        try {
            const response = await this.client.delete(`/ship/${shipmentId}`);
            logger.info('Shipment cancelled:', { shipmentId });
            return response.data;
        } catch (error) {
            logger.error('Error cancelling shipment:', error);
            throw error;
        }
    }

    // Get Insurance Quote
    async getInsuranceQuote(declaredValue: number, carrier: string) {
        try {
            const response = await this.client.post('/insurance/quote', {
                declared_value: declaredValue,
                carrier
            });
            logger.info('Insurance quote retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error getting insurance quote:', error);
            throw error;
        }
    }

    // Get Pickup Availability
    async getPickupAvailability(
        address: EnviaAddress,
        carrier: string,
        date: string
    ) {
        try {
            const response = await this.client.post('/pickup/availability', {
                address,
                carrier,
                date
            });
            logger.info('Pickup availability retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error getting pickup availability:', error);
            throw error;
        }
    }

    // Schedule Pickup
    async schedulePickup(
        address: EnviaAddress,
        carrier: string,
        date: string,
        timeWindow: string,
        shipmentIds: string[]
    ) {
        try {
            const response = await this.client.post('/pickup', {
                address,
                carrier,
                date,
                time_window: timeWindow,
                shipment_ids: shipmentIds
            });
            
            // Store pickup in database
            const pickupData = {
                pickupId: response.data.pickupId,
                address,
                carrier,
                date,
                timeWindow,
                shipmentIds,
                status: 'scheduled'
            };
            
            await EnviaPickup.create(pickupData);
            
            logger.info('Pickup scheduled:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error scheduling pickup:', error);
            throw error;
        }
    }

    // Cancel Pickup
    async cancelPickup(pickupId: string) {
        try {
            const response = await this.client.delete(`/pickup/${pickupId}`);
            
            // Update pickup status in database
            await EnviaPickup.findOneAndUpdate(
                { pickupId },
                { status: 'cancelled' }
            );
            
            logger.info('Pickup cancelled:', { pickupId });
            return response.data;
        } catch (error) {
            logger.error('Error cancelling pickup:', error);
            throw error;
        }
    }
}

export default EnviacomPlugin;
