import axios, { AxiosInstance } from 'axios';
import { validateFacturamaEnv } from '../validation/env';
import { logger } from '../../../utils/logger';
import { OrderModel } from '../../../modules/order/model';
import { UserModel } from '../../../modules/user/model';
import { RFCModel } from '../../../modules/RFCs/model';
import { InvoiceModel } from '../models/invoice.model';

export class FacturamaService {
    private client: AxiosInstance;
    private config: ReturnType<typeof validateFacturamaEnv>;
    private catalogsCache: {
        taxRegimes?: any[];
        paymentForms?: any[];
        paymentMethods?: any[];
        productServices?: any[];
        units?: any[];
        currencies?: any[];
        lastUpdate?: Date;
    } = {};

    constructor(env: Record<string, any>) {
        this.config = validateFacturamaEnv(env);
        
        const baseURL = this.config.FACTURAMA_IS_SANDBOX 
            ? 'https://apisandbox.facturama.mx'
            : 'https://api.facturama.mx';

        this.client = axios.create({
            baseURL,
            auth: {
                username: this.config.FACTURAMA_USERNAME,
                password: this.config.FACTURAMA_PASSWORD
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    private async refreshCatalogs(): Promise<void> {
        try {
            const now = new Date();
            // Refresh catalogs if they're older than 24 hours or don't exist
            if (!this.catalogsCache.lastUpdate || 
                (now.getTime() - this.catalogsCache.lastUpdate.getTime()) > 24 * 60 * 60 * 1000) {
                
                const [
                    taxRegimes,
                    paymentForms,
                    paymentMethods,
                    productServices,
                    units,
                    currencies
                ] = await Promise.all([
                    this.client.get('/catalogs/FiscalRegimens'),
                    this.client.get('/catalogs/PaymentForms'),
                    this.client.get('/catalogs/PaymentMethods'),
                    this.client.get('/catalogs/ProductsOrServices'),
                    this.client.get('/catalogs/Units'),
                    this.client.get('/catalogs/Currencies')
                ]);

                this.catalogsCache = {
                    taxRegimes: taxRegimes.data,
                    paymentForms: paymentForms.data,
                    paymentMethods: paymentMethods.data,
                    productServices: productServices.data,
                    units: units.data,
                    currencies: currencies.data,
                    lastUpdate: now
                };
            }
        } catch (error) {
            logger.error('Error refreshing Facturama catalogs:', error);
            throw new Error('Failed to refresh Facturama catalogs');
        }
    }

    public async getCatalogs() {
        await this.refreshCatalogs();
        return this.catalogsCache;
    }

    private async createFacturamaCustomer(user: { email: string }, rfc: { rfc: string; social_reason: string; tax_regime: string }) {
        try {
            const customer = {
                Email: user.email,
                Rfc: rfc.rfc,
                Name: rfc.social_reason,
                TaxResidence: "", // Optional, can be added if needed
                TaxRegime: rfc.tax_regime,
                CfdiUse: "G01" // General expenses, can be made configurable if needed
            };

            const response = await this.client.post('/api/Customer', customer);
            return response.data;
        } catch (error) {
            logger.error('Error creating Facturama customer:', error);
            throw new Error('Failed to create Facturama customer');
        }
    }

    public async createInvoice(orderId: string): Promise<any> {
        try {
            // Get order with populated references
            const order = await OrderModel.findById(orderId)
                .populate('user_id')
                .populate('package_id')
                .populate({
                    path: 'user_id',
                    populate: {
                        path: 'RFC'
                    }
                })
                .lean();

            if (!order) {
                throw new Error('Order not found');
            }

            if (!order || !order.user_id) {
                throw new Error('Order or user not found');
            }

            const user = order.user_id as any;
            if (!user.RFC) {
                throw new Error('User RFC not found');
            }

            const rfc = user.RFC as any;

            // Create or get customer in Facturama
            const customer = await this.createFacturamaCustomer(
                { email: user.email },
                { 
                    rfc: rfc.rfc,
                    social_reason: rfc.social_reason,
                    tax_regime: rfc.tax_regime
                }
            );

            // Prepare invoice items from order packages
            const items = (order.package_id || []).map((pack: any) => ({
                ProductCode: "43232408", // Software de desarrollo de plataformas web
                Description: pack.name,
                UnitCode: "E48", // Unidad de servicio
                UnitPrice: pack.price,
                Quantity: 1,
                Subtotal: pack.price,
                TaxObject: "02", // Object subject to tax
                Taxes: [{
                    Name: "IVA",
                    Rate: 0.16,
                    Total: pack.price * 0.16,
                    Base: pack.price,
                    IsRetention: false
                }],
                Total: pack.price * 1.16
            }));

            // Create CFDI
            const cfdi = {
                Serie: "A",
                Currency: "MXN",
                ExpeditionPlace: "72000", // Can be made configurable
                PaymentConditions: "CONTADO",
                CfdiType: "I",
                PaymentForm: rfc.method_payment,
                PaymentMethod: "PUE",
                Exportation: "01", // Nacional
                Customer: customer,
                Items: items,
                Observations: `Orden: ${order._id}`,
                OrderNumber: order._id.toString(),
                NameId: "1", // Default template
                CfdiUse: "G03", // Gastos en general
                TaxResidence: "", // Optional for national customers
                NumRegIdTrib: "" // Optional for national customers
            };

            const response = await this.client.post('/api/3/cfdis', cfdi);
            const invoice = response.data;

            // Save invoice in our database
            const newInvoice = await InvoiceModel.create({
                order_id: order._id,
                user_id: user._id,
                facturama_id: invoice.Id,
                facturama_uuid: invoice.Uuid,
                total: invoice.Total,
                subtotal: invoice.Subtotal,
                tax: invoice.Total - invoice.Subtotal,
                status: 'active',
                pdf_url: invoice.Pdf,
                xml_url: invoice.Xml
            });

            return newInvoice;
        } catch (error) {
            logger.error('Error creating invoice:', error);
            throw error;
        }
    }

    public async cancelInvoice(invoiceId: string): Promise<void> {
        try {
            const invoice = await InvoiceModel.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Cancel in Facturama
            await this.client.delete(`/api/3/cfdis/${invoice.facturama_id}`);

            // Update status in our database
            invoice.status = 'cancelled';
            await invoice.save();
        } catch (error) {
            logger.error('Error cancelling invoice:', error);
            throw error;
        }
    }

    public async getInvoice(invoiceId: string): Promise<any> {
        try {
            const invoice = await InvoiceModel.findById(invoiceId)
                .populate('order_id')
                .populate('user_id');
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            return invoice;
        } catch (error) {
            logger.error('Error getting invoice:', error);
            throw error;
        }
    }

    public async listInvoices(userId?: string): Promise<any[]> {
        try {
            const query = userId ? { user_id: userId } : {};
            const invoices = await InvoiceModel.find(query)
                .populate('order_id')
                .populate('user_id')
                .sort({ createdAt: -1 });
            
            return invoices;
        } catch (error) {
            logger.error('Error listing invoices:', error);
            throw error;
        }
    }
}
