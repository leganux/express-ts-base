import { Request, Response } from 'express';
import { UserModel, IUser } from './model';
import { logger } from '../../utils/logger';

const Apiato = require('apiato');
const apiato = new Apiato({
  database: 'nosql',
  prefix: 'api'
});

// Validation schema for user
const validationObject = {
  name: 'string',
  email: 'string',
  password: 'string'
};

// Options for Apiato methods
const options = {
  customErrorCode: 500,
  customValidationCode: 400,
  customNotFoundCode: 404,
  mongooseOptions: {
    new: true,
    runValidators: true
  }
};

export const userController = {
  // Create a new user
  create: async (req: Request, res: Response) => {
    try {
      logger.info('Creating new user');
      logger.debug('User data:', req.body);
      
      const result = await apiato.createOne(UserModel, validationObject, null, options)(req, res);
      logger.info('User created successfully');
      return result;
    } catch (error) {
      logger.error('Error creating user:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        message: 'Error creating user',
        code: 500,
        data: {}
      });
    }
  },

  // Get all users
  getAll: async (req: Request, res: Response) => {
    try {
      logger.info('Fetching all users');
      const result = await apiato.getMany(UserModel, null, options)(req, res);
      logger.info('Users fetched successfully');
      return result;
    } catch (error) {
      logger.error('Error fetching users:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        message: 'Error fetching users',
        code: 500,
        data: {}
      });
    }
  },

  // Get user by ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      logger.info(`Fetching user with ID: ${id}`);
      
      const result = await apiato.getOneById(UserModel, null, options)(req, res);
      logger.info('User fetched successfully');
      return result;
    } catch (error) {
      logger.error('Error fetching user:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        message: 'Error fetching user',
        code: 500,
        data: {}
      });
    }
  },

  // Update user
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      logger.info(`Updating user with ID: ${id}`);
      logger.debug('Update data:', req.body);
      
      const result = await apiato.updateById(UserModel, validationObject, null, options)(req, res);
      logger.info('User updated successfully');
      return result;
    } catch (error) {
      logger.error('Error updating user:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        message: 'Error updating user',
        code: 500,
        data: {}
      });
    }
  },

  // Delete user
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      logger.info(`Deleting user with ID: ${id}`);
      
      const result = await apiato.findIdAndDelete(UserModel, options)(req, res);
      logger.info('User deleted successfully');
      return result;
    } catch (error) {
      logger.error('Error deleting user:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        message: 'Error deleting user',
        code: 500,
        data: {}
      });
    }
  }
};
