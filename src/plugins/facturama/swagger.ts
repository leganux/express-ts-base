export const facturamaSwagger = {
    paths: {
        '/api/v1/facturama/catalogs': {
            get: {
                tags: ['Facturama'],
                summary: 'Get Facturama catalogs',
                description: 'Retrieve all Facturama catalogs including tax regimes, payment forms, etc.',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Catalogs retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        taxRegimes: { type: 'array', items: { type: 'object' } },
                                        paymentForms: { type: 'array', items: { type: 'object' } },
                                        paymentMethods: { type: 'array', items: { type: 'object' } },
                                        productServices: { type: 'array', items: { type: 'object' } },
                                        units: { type: 'array', items: { type: 'object' } },
                                        currencies: { type: 'array', items: { type: 'object' } }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized' },
                    500: { description: 'Internal server error' }
                }
            }
        },
        '/api/v1/facturama/invoices/order/{orderId}': {
            post: {
                tags: ['Facturama'],
                summary: 'Create invoice from order',
                description: 'Generate a new invoice from an existing order',
                security: [{ bearerAuth: [] }],
                parameters: [{
                    in: 'path',
                    name: 'orderId',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Order ID'
                }],
                responses: {
                    201: {
                        description: 'Invoice created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        _id: { type: 'string' },
                                        order_id: { type: 'string' },
                                        user_id: { type: 'string' },
                                        facturama_id: { type: 'string' },
                                        facturama_uuid: { type: 'string' },
                                        total: { type: 'number' },
                                        subtotal: { type: 'number' },
                                        tax: { type: 'number' },
                                        status: { type: 'string', enum: ['active', 'cancelled'] },
                                        pdf_url: { type: 'string' },
                                        xml_url: { type: 'string' },
                                        createdAt: { type: 'string', format: 'date-time' },
                                        updatedAt: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Invalid request' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Order not found' },
                    500: { description: 'Internal server error' }
                }
            }
        },
        '/api/v1/facturama/invoices/{invoiceId}': {
            get: {
                tags: ['Facturama'],
                summary: 'Get invoice details',
                description: 'Retrieve details of a specific invoice',
                security: [{ bearerAuth: [] }],
                parameters: [{
                    in: 'path',
                    name: 'invoiceId',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Invoice ID'
                }],
                responses: {
                    200: {
                        description: 'Invoice details retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        _id: { type: 'string' },
                                        order_id: { type: 'string' },
                                        user_id: { type: 'string' },
                                        facturama_id: { type: 'string' },
                                        facturama_uuid: { type: 'string' },
                                        total: { type: 'number' },
                                        subtotal: { type: 'number' },
                                        tax: { type: 'number' },
                                        status: { type: 'string', enum: ['active', 'cancelled'] },
                                        pdf_url: { type: 'string' },
                                        xml_url: { type: 'string' },
                                        createdAt: { type: 'string', format: 'date-time' },
                                        updatedAt: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Invoice not found' },
                    500: { description: 'Internal server error' }
                }
            },
            delete: {
                tags: ['Facturama'],
                summary: 'Cancel invoice',
                description: 'Cancel an existing invoice',
                security: [{ bearerAuth: [] }],
                parameters: [{
                    in: 'path',
                    name: 'invoiceId',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Invoice ID'
                }],
                responses: {
                    200: { description: 'Invoice cancelled successfully' },
                    401: { description: 'Unauthorized' },
                    404: { description: 'Invoice not found' },
                    500: { description: 'Internal server error' }
                }
            }
        },
        '/api/v1/facturama/invoices': {
            get: {
                tags: ['Facturama'],
                summary: 'List invoices',
                description: 'Retrieve a list of invoices, optionally filtered by user',
                security: [{ bearerAuth: [] }],
                parameters: [{
                    in: 'query',
                    name: 'userId',
                    required: false,
                    schema: { type: 'string' },
                    description: 'Filter invoices by user ID'
                }],
                responses: {
                    200: {
                        description: 'Invoices retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            _id: { type: 'string' },
                                            order_id: { type: 'string' },
                                            user_id: { type: 'string' },
                                            facturama_id: { type: 'string' },
                                            facturama_uuid: { type: 'string' },
                                            total: { type: 'number' },
                                            subtotal: { type: 'number' },
                                            tax: { type: 'number' },
                                            status: { type: 'string', enum: ['active', 'cancelled'] },
                                            pdf_url: { type: 'string' },
                                            xml_url: { type: 'string' },
                                            createdAt: { type: 'string', format: 'date-time' },
                                            updatedAt: { type: 'string', format: 'date-time' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized' },
                    500: { description: 'Internal server error' }
                }
            }
        }
    }
};
