import { Router } from 'express';
import { google } from 'googleapis';
import { IPlugin } from '../../types/plugin';
import { Express } from 'express';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph } from 'docx';
import { FileOperation } from './models/file-operation.model';
import { logger } from '../../utils/logger';

export class GoogleDrivePlugin implements IPlugin {
    name = 'googledrive';
    version = '1.0.0';
    private router: Router;
    private drive;

    constructor(private apiKey?: string) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes() {
        // Excel Routes
        this.router.post('/excel/read', async (req, res) => {
            try {
                const { fileId } = req.body;
                if (!fileId) {
                    return res.status(400).json({ error: 'File ID is required' });
                }
                const data = await this.readExcelFile(fileId);
                res.json({ data });
            } catch (error) {
                res.status(500).json({ error: 'Error reading Excel file' });
            }
        });

        this.router.post('/excel/write', async (req, res) => {
            try {
                const { fileName, data } = req.body;
                if (!fileName || !data || !Array.isArray(data)) {
                    return res.status(400).json({ error: 'File name and data array are required' });
                }
                const fileId = await this.writeExcelFile(fileName, data);
                res.json({ fileId });
            } catch (error) {
                res.status(500).json({ error: 'Error writing Excel file' });
            }
        });

        // Word Routes
        this.router.post('/word/read', async (req, res) => {
            try {
                const { fileId } = req.body;
                if (!fileId) {
                    return res.status(400).json({ error: 'File ID is required' });
                }
                const content = await this.readWordFile(fileId);
                res.json({ content });
            } catch (error) {
                res.status(500).json({ error: 'Error reading Word file' });
            }
        });

        this.router.post('/word/write', async (req, res) => {
            try {
                const { fileName, content } = req.body;
                if (!fileName || !content) {
                    return res.status(400).json({ error: 'File name and content are required' });
                }
                const fileId = await this.writeWordFile(fileName, content);
                res.json({ fileId });
            } catch (error) {
                res.status(500).json({ error: 'Error writing Word file' });
            }
        });
    }

    async readExcelFile(fileId: string): Promise<any[]> {
        try {
            const response = await (this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'arraybuffer' }
            ) as unknown as { data: ArrayBuffer });
            const buffer = Buffer.from(new Uint8Array(response.data));
            const workbook = XLSX.read(buffer);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(firstSheet);
            
            // Log successful operation
            await FileOperation.create({
                fileId,
                fileName: `${fileId}.xlsx`,
                operation: 'read',
                fileType: 'excel',
                status: 'success'
            });
            
            return data;
        } catch (error) {
            // Log failed operation
            await FileOperation.create({
                fileId,
                fileName: `${fileId}.xlsx`,
                operation: 'read',
                fileType: 'excel',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Error reading Excel file');
        }
    }

    async writeExcelFile(fileName: string, data: any[]): Promise<string> {
        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            
            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
                media: {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    body: buffer,
                },
            });

            const fileId = response.data.id || '';
            
            // Log successful operation
            await FileOperation.create({
                fileId,
                fileName,
                operation: 'write',
                fileType: 'excel',
                status: 'success'
            });

            return fileId;
        } catch (error) {
            // Log failed operation
            await FileOperation.create({
                fileId: 'failed',
                fileName,
                operation: 'write',
                fileType: 'excel',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Error writing Excel file');
        }
    }

    async readWordFile(fileId: string): Promise<string> {
        try {
            const response = await (this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'arraybuffer' }
            ) as unknown as { data: ArrayBuffer });
            // Convert ArrayBuffer to Buffer and then to string
            const buffer = Buffer.from(new Uint8Array(response.data));
            const content = buffer.toString('utf-8');

            // Log successful operation
            await FileOperation.create({
                fileId,
                fileName: `${fileId}.docx`,
                operation: 'read',
                fileType: 'word',
                status: 'success'
            });

            return content;
        } catch (error) {
            // Log failed operation
            await FileOperation.create({
                fileId,
                fileName: `${fileId}.docx`,
                operation: 'read',
                fileType: 'word',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Error reading Word file');
        }
    }

    async writeWordFile(fileName: string, content: string): Promise<string> {
        try {
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: content
                        })
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);

            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                },
                media: {
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    body: buffer,
                },
            });

            const fileId = response.data.id || '';

            // Log successful operation
            await FileOperation.create({
                fileId,
                fileName,
                operation: 'write',
                fileType: 'word',
                status: 'success'
            });

            return fileId;
        } catch (error) {
            // Log failed operation
            await FileOperation.create({
                fileId: 'failed',
                fileName,
                operation: 'write',
                fileType: 'word',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Error writing Word file');
        }
    }
    async initialize(app: Express): Promise<void> {
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required');
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: [
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.readonly'
            ],
        });
        this.drive = google.drive({ version: 'v3', auth });

        app.use('/googledrive', this.router);
        logger.info('Google Drive plugin initialized successfully');
    }
}

export default GoogleDrivePlugin;
