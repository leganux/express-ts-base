import { Request, Response } from 'express';
import { ProductModel, IProduct } from './model';

interface ApiError {
  message: string,
  [key: string]: any
}

export class ProductController {
  // Add custom controller methods here
}
