import { Router } from 'express';
import { UserModel } from './model';
import { ApiatoNoSQL } from '../../libs/apiato/no-sql/apiato';
import { UserRole } from '../../types/user';
import { UserController } from './controller';
import { validateFirebaseToken, roleGuard } from '../../middleware/auth.middleware';

const router = Router();
const apiato = new ApiatoNoSQL();

// Apply authentication middleware to all routes
router.use(validateFirebaseToken);

// Validation schema for user
const userValidation = {
  firebaseUid: 'string,mandatory',
  name: 'string,mandatory',
  email: 'string,mandatory',
  role: 'string,mandatory',
  photoURL: 'string',
  emailVerified: 'boolean'
};

// Population object (empty since we don't have relations yet)
const populationObject = {};



// Create datatable method
router.post('/datatable', roleGuard([UserRole.ADMIN]), apiato.datatable_aggregate(
  UserModel,
  [],
  'name,email',
  { allowDiskUse: true, search_by_field: true }
));


// Create a new user (Admin only)
router.post('/', roleGuard([UserRole.ADMIN]), apiato.createOne(
  UserModel,
  userValidation,
  populationObject,
  { customValidationCode: 400 }
));

// Get all users with pagination (Admin only)
router.get('/', roleGuard([UserRole.ADMIN]), apiato.getMany(
  UserModel,
  populationObject
));

// Get user by ID (Admin and owner)
router.get('/:id', apiato.getOneById(
  UserModel,
  populationObject
));

// Update user by ID (Admin and owner)
router.put('/:id', apiato.updateById(
  UserModel,
  userValidation,
  populationObject,
  { updateFieldName: 'updatedAt' }
));

// Delete user by ID (Admin only)
router.delete('/:id', roleGuard([UserRole.ADMIN]), apiato.findIdAndDelete(
  UserModel
));

// Additional Apiato operations
router.post('/find-update-create', roleGuard([UserRole.ADMIN]), apiato.findUpdateOrCreate(
  UserModel,
  userValidation,
  populationObject,
  { updateFieldName: 'updatedAt' }
));

router.put('/find-update', roleGuard([UserRole.ADMIN]), apiato.findUpdate(
  UserModel,
  userValidation,
  populationObject,
  { updateFieldName: 'updatedAt' }
));

router.get('/where/first', roleGuard([UserRole.ADMIN]), apiato.getOneWhere(
  UserModel,
  populationObject
));

// Custom operations
router.get('/firebase/:firebaseUid', roleGuard([UserRole.ADMIN]), UserController.getByFirebaseUid);
router.patch('/:id/last-login', UserController.updateLastLogin);
router.patch('/:id/email-verification', roleGuard([UserRole.ADMIN]), UserController.updateEmailVerification);
router.patch('/:id/role', roleGuard([UserRole.ADMIN]), UserController.updateRole);



export default router;
