import { Router } from 'express';
import { ProductModel } from './model';
import { ApiatoNoSQL } from '../../libs/apiato/no-sql/apiato';
import { validateFirebaseToken, roleGuard } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/user';
import { ProductController } from './controller';

const router = Router();
const apiato = new ApiatoNoSQL();

// Apply authentication middleware to all routes
router.use(validateFirebaseToken);

// Empty validation and population objects
const productValidation = {};
const populationObject = {};

// Create datatable method,
router.post('/datatable', roleGuard([UserRole.ADMIN]), apiato.datatable_aggregate(ProductModel, [], '', { allowDiskUse: true, search_by_field: true }));

// Get all with pagination,
router.get('/', apiato.getMany(ProductModel, populationObject));

// Get one by ID,
router.get('/:id', apiato.getOneById(ProductModel, populationObject));

// Create new,
router.post('/', roleGuard([UserRole.ADMIN]), apiato.createOne(ProductModel, productValidation, populationObject, { customValidationCode: 400 }));

// Update by ID,
router.put('/:id', roleGuard([UserRole.ADMIN]), apiato.updateById(ProductModel, productValidation, populationObject, { updateFieldName: 'updatedAt' }));

// Delete by ID,
router.delete('/:id', roleGuard([UserRole.ADMIN]), apiato.findIdAndDelete(ProductModel));

// Additional Apiato operations,
router.post('/find-update-create', roleGuard([UserRole.ADMIN]), apiato.findUpdateOrCreate(ProductModel, productValidation, populationObject, { updateFieldName: 'updatedAt' }));

router.put('/find-update', roleGuard([UserRole.ADMIN]), apiato.findUpdate(ProductModel, productValidation, populationObject, { updateFieldName: 'updatedAt' }));

router.get('/where/first', roleGuard([UserRole.ADMIN]), apiato.getOneWhere(ProductModel, populationObject));

export default router;