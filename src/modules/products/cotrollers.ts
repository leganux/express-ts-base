import {productModel} from './model'
import {Request, Response} from 'express';

const urlApi = 'https://fakestoreapi.com'
import axios from 'axios'

export class productController {
    static async getAllProducts(req: Request, res: Response) {
        try {
            console.log('hello world')

            let products = await axios.get(urlApi + '/products')

            if (products.status !== 200 || !products.data) {
                // return res.status(500).json({
                //     message: 'Error, not found products',
                //     error: 'Error, not found products'
                // })
                throw new Error('Error, not found products')
            }

            return res.status(200).json({
                message: 'Success',
                data: products.data
            })
        } catch (error) {
            res.status(500).json({
                message: 'Error',
                error: error.message
            })
        }
    }

    static async createOneProduct(req: Request, res: Response) {
        try {
            let body = req.body

            if (!body.id) {
                throw new Error('Error, not found id')
            }

            let product = await axios.get(urlApi + '/products/' + body.id)
            console.log('product', product.data)
            let data = product.data

            let newProduct = new productModel({
                idForeign: data.id,
                title: data.title,
                price: data.price,
                category: data.category,
                description: data.description,
                image: data.image
            })

            await newProduct.save()

            console.log('create one')
            return res.status(200).json({
                message: 'Success',
                data: newProduct
            })
        } catch (e) {
            res.status(500).json({
                message: 'Error',
                error: e.message
            })
        }
    }
}
