import { Request, Response, NextFunction } from 'express';
import { adminAuth, UserRole, getUserRole } from '../config/firebase';
import { logger } from '../utils/logger';
import { UserModel } from '../modules/users/model';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: UserRole;
    dbUser?: any;
  };
}

export const validateFirebaseToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        success: false,
        message: 'Authentication required',
        code: 401,
        data: {}
      });
    }

    const token = authHeader.split('Bearer ')[1];
    logger.debug('Validating token');

    // Verify the Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    logger.debug('Token verified successfully');

    // Get user role from Firebase custom claims
    const role = await getUserRole(decodedToken.uid);
    logger.debug('User role retrieved:', { role });

    // Get user from database
    const dbUser = await UserModel.findOne({ firebaseUid: decodedToken.uid });
    if (!dbUser) {
      logger.warn('User not found in database:', { uid: decodedToken.uid });
      return res.status(404).json({
        error: 'User not found in database',
        success: false,
        message: 'User record not found',
        code: 404,
        data: {}
      });
    }

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
      dbUser
    };

    logger.debug('User authenticated:', { 
      uid: decodedToken.uid, 
      email: decodedToken.email,
      role 
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      error: error instanceof Error ? error.message : 'Invalid token',
      success: false,
      message: 'Authentication failed',
      code: 401,
      data: {}
    });
  }
};

export const roleGuard = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.warn('Role guard: No user in request');
        return res.status(401).json({
          error: 'Authentication required',
          success: false,
          message: 'User not authenticated',
          code: 401,
          data: {}
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Unauthorized access attempt:', {
          uid: req.user.uid,
          role: req.user.role,
          requiredRoles: allowedRoles
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          success: false,
          message: 'You do not have permission to access this resource',
          code: 403,
          data: {}
        });
      }

      logger.debug('Role guard passed:', {
        uid: req.user.uid,
        role: req.user.role,
        allowedRoles
      });

      next();
    } catch (error) {
      logger.error('Role guard error:', error);
      return res.status(500).json({
        error: 'Role verification failed',
        success: false,
        message: 'Internal server error',
        code: 500,
        data: {}
      });
    }
  };
};
