import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { SkydropxShipment } from './models/shipment.model';
import { SkydropxLabel } from './models/label.model';
import { SkydropxTracking } from './models/tracking.model';

export interface ShipmentAddress {
    street1: string;
    street2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    name: string;
    company?: string;
    phone: string;
    email: string;
    reference?: string;
    contents: string;
}

export interface ParcelDimensions {
    weight: number;
    height: number;
    width: number;
    length: number;
}

import { Express } from 'express';
import { IPlugin } from '../../types/plugin';

export class SkydropxPlugin implements IPlugin {
    private client!: AxiosInstance;
    private readonly baseURL = 'https://api.skydropx.com/v1';
    
    name = 'skydropx';
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
                'Authorization': `Token token=${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async initialize(app: Express): Promise<void> {
        if (!this.apiKey) {
            throw new Error('API key is required for Skydropx plugin');
        }
        this.initializeClient(this.apiKey);
        logger.info('Skydropx plugin initialized successfully');
    }

    // Create Shipment
    async createShipment(
        fromAddress: ShipmentAddress,
        toAddress: ShipmentAddress,
        parcel: ParcelDimensions,
        consignmentNote: string
    ) {
        try {
            const response = await this.client.post('/shipments', {
                address_from: {
                    street1: fromAddress.street1,
                    street2: fromAddress.street2,
                    city: fromAddress.city,
                    province: fromAddress.province,
                    country: fromAddress.country,
                    postal_code: fromAddress.zip,
                    name: fromAddress.name,
                    company: fromAddress.company,
                    phone: fromAddress.phone,
                    email: fromAddress.email,
                    reference: fromAddress.reference,
                    contents: fromAddress.contents
                },
                address_to: {
                    street1: toAddress.street1,
                    street2: toAddress.street2,
                    city: toAddress.city,
                    province: toAddress.province,
                    country: toAddress.country,
                    postal_code: toAddress.zip,
                    name: toAddress.name,
                    company: toAddress.company,
                    phone: toAddress.phone,
                    email: toAddress.email,
                    reference: toAddress.reference,
                    contents: toAddress.contents
                },
                parcels: [{
                    weight: parcel.weight,
                    distance_unit: 'CM',
                    mass_unit: 'KG',
                    height: parcel.height,
                    width: parcel.width,
                    length: parcel.length
                }],
                consignment_note_class_code: consignmentNote,
                consignment_note_packaging_code: 'BOX'
            });

            // Store shipment in database
            await SkydropxShipment.create({
                shipmentId: response.data.id,
                fromAddress,
                toAddress,
                parcel,
                consignmentNote,
                status: response.data.status
            });

            logger.info('Shipment created:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error creating shipment:', error);
            throw error;
        }
    }

    // Get Shipping Rates
    async getShippingRates(shipmentId: string) {
        try {
            const response = await this.client.get(`/shipments/${shipmentId}/rates`);
            logger.info('Shipping rates retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error getting shipping rates:', error);
            throw error;
        }
    }

    // Create Label
    async createLabel(rateId: string) {
        try {
            const response = await this.client.post('/labels', {
                rate_id: rateId,
                label_format: 'pdf'
            });

            // Store label in database
            await SkydropxLabel.create({
                labelId: response.data.id,
                shipmentId: response.data.shipment_id,
                rateId,
                format: 'pdf',
                status: response.data.status,
                url: response.data.label_url
            });

            // Update shipment with label info
            await SkydropxShipment.findOneAndUpdate(
                { shipmentId: response.data.shipment_id },
                { 
                    labelId: response.data.id,
                    rateId
                }
            );

            logger.info('Label created:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error creating label:', error);
            throw error;
        }
    }

    // Track Shipment
    async trackShipment(trackingNumber: string) {
        try {
            const response = await this.client.get(`/tracking?tracking_number=${trackingNumber}`);

            // Store tracking update
            const trackingData = {
                shipmentId: response.data.shipment_id,
                trackingNumber,
                status: response.data.status,
                location: response.data.location,
                description: response.data.description,
                timestamp: new Date(response.data.timestamp),
                carrierName: response.data.carrier,
                estimatedDeliveryDate: response.data.estimated_delivery_date ? 
                    new Date(response.data.estimated_delivery_date) : undefined
            };

            await SkydropxTracking.create(trackingData);

            // Update shipment status
            await SkydropxShipment.findOneAndUpdate(
                { trackingNumber },
                { 
                    status: response.data.status,
                    estimatedDeliveryDate: trackingData.estimatedDeliveryDate
                }
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

    // Cancel Shipment
    async cancelShipment(shipmentId: string) {
        try {
            const response = await this.client.delete(`/shipments/${shipmentId}`);
            logger.info('Shipment cancelled:', { shipmentId });
            return response.data;
        } catch (error) {
            logger.error('Error cancelling shipment:', error);
            throw error;
        }
    }

    // Get Shipment Details
    async getShipment(shipmentId: string) {
        try {
            const response = await this.client.get(`/shipments/${shipmentId}`);
            logger.info('Shipment details retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error getting shipment details:', error);
            throw error;
        }
    }

    // Get Label Status
    async getLabelStatus(labelId: string) {
        try {
            const response = await this.client.get(`/labels/${labelId}`);
            logger.info('Label status retrieved:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error getting label status:', error);
            throw error;
        }
    }
}

export default SkydropxPlugin;
