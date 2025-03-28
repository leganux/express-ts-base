import {Router, Request, Response} from 'express';
import {productController} from './cotrollers'

const router = Router();

router.get('/getAllProducts', productController.getAllProducts)

router.post('/createOne', productController.createOneProduct)


export default router;



