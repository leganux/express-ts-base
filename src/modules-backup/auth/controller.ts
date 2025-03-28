import { Request, Response } from 'express';
import { adminAuth, UserRole, setUserRole } from '../../config/firebase';
import { UserModel } from '../users/model';
import { logger } from '../../utils/logger';

interface FirebaseDecodedToken {
  email: string;
  name?: string;
  picture?: string;
  uid: string;
  email_verified?: boolean;
}

export const authController = {
  // Login with Firebase ID Token
  loginWithToken: async (req: Request, res: Response) => {
    try {
      const { idToken, firstName, lastName } = req.body;
      logger.debug('Starting login with token process');

      // Verify the Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(idToken) as FirebaseDecodedToken;
      const { email, name, picture, uid, email_verified } = decodedToken;

      logger.debug('Token decoded successfully:', {
        email,
        name,
        picture,
        email_verified
      });

      // Send verification email if not verified
      if (!email_verified) {
        logger.info('Sending verification email to:', { email });
        await adminAuth.generateEmailVerificationLink(email);
      }

      // Check if user exists in our database
      let user = await UserModel.findOne({ firebaseUid: uid });
      
      if (!user) {
        logger.info('Registering new user from Firebase Auth:', { email });

        // Use provided name/lastName if available, otherwise split display name
        const userFirstName = firstName || (name ? name.split(' ')[0] : '');
        const userLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : '');

        // Create user in database
        user = await UserModel.create({
          firebaseUid: uid,
          email,
          name: `${userFirstName} ${userLastName}`.trim(),
          role: UserRole.USER,
          emailVerified: email_verified || false,
          photoURL: picture || null
        });

        logger.info('New user registered in database:', { uid });
      } else {
        // Update photo if Firebase has one and local doesn't
        if (user && !user.photoURL && picture) {
          user = await UserModel.findOneAndUpdate(
            { firebaseUid: uid },
            { photoURL: picture },
            { new: true }
          );
          logger.info('User photo updated:', { uid });
        }
      }

      // Set custom claims
      if (!user) {
        throw new Error('User not found after creation/update');
      }

      // Keep custom claims minimal to avoid size limit
      const customClaims = {
        role: user.role,
        uid: user.id // Only include essential data
      };
      
      await adminAuth.setCustomUserClaims(uid, customClaims);
      logger.info('Custom claims set for user:', { uid });

      // Generate custom token
      const customToken = await adminAuth.createCustomToken(uid, customClaims);
      logger.info('Custom token generated:', { uid });

      res.json({
        error: null,
        success: true,
        message: 'Login successful',
        code: 200,
        data: {
          user,
          token: customToken
        }
      });
    } catch (error) {
      logger.error('Firebase token verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';

      res.status(401).json({
        error: errorMessage,
        success: false,
        message: 'Invalid token',
        code: 401,
        data: {}
      });
    }
  },

  // Register with email and password
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      logger.debug('Starting user registration process', { email });

      // Create user in Firebase using Admin SDK
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });

      logger.info('User created in Firebase:', { uid: userRecord.uid });

      // Set initial role
      await setUserRole(userRecord.uid, UserRole.USER);
      logger.info('Role set for user:', { uid: userRecord.uid, role: UserRole.USER });

      // Create user in database
      const newUser = await UserModel.create({
        firebaseUid: userRecord.uid,
        email: userRecord.email,
        name,
        role: UserRole.USER,
        emailVerified: userRecord.emailVerified
      });
      logger.info('User created in database:', { uid: userRecord.uid });

      // Generate custom token with minimal claims
      const customClaims = {
        role: UserRole.USER,
        uid: newUser.id
      };
      const customToken = await adminAuth.createCustomToken(userRecord.uid, customClaims);
      logger.info('Custom token generated for user:', { uid: userRecord.uid });

      res.status(201).json({
        error: null,
        success: true,
        message: 'User registered successfully',
        code: 201,
        data: {
          user: newUser,
          token: customToken
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      res.status(400).json({
        error: errorMessage,
        success: false,
        message: 'Failed to register user',
        code: 400,
        data: {}
      });
    }
  },

  // Login with email and password
  login: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      logger.debug('Starting login process', { email });

      // Get user by email
      const userRecord = await adminAuth.getUserByEmail(email);
      logger.info('User found:', { uid: userRecord.uid });

      // Get user from database
      const dbUser = await UserModel.findOne({ firebaseUid: userRecord.uid });

      // Get custom token with minimal claims
      const customClaims = {
        role: dbUser?.role || UserRole.USER,
        uid: dbUser?.id
      };
      const customToken = await adminAuth.createCustomToken(userRecord.uid, customClaims);
      logger.info('Custom token generated:', { uid: userRecord.uid });

      // Update user's last login
      await UserModel.findOneAndUpdate(
        { firebaseUid: userRecord.uid },
        { lastLogin: new Date() }
      );
      logger.info('Last login updated:', { uid: userRecord.uid });

      res.json({
        error: null,
        success: true,
        message: 'Login successful',
        code: 200,
        data: {
          token: customToken,
          user: dbUser
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';

      res.status(401).json({
        error: errorMessage,
        success: false,
        message: 'Invalid credentials',
        code: 401,
        data: {}
      });
    }
  },

  // Reset Password
  resetPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      logger.debug('Starting password reset process', { email });

      // Generate password reset link
      const link = await adminAuth.generatePasswordResetLink(email);
      logger.info('Password reset link generated:', { email });

      // Here you would typically send this link via email
      // For now, we'll return it in the response
      res.json({
        error: null,
        success: true,
        message: 'Password reset link generated',
        code: 200,
        data: {
          resetLink: link
        }
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';

      res.status(400).json({
        error: errorMessage,
        success: false,
        message: 'Failed to generate password reset link',
        code: 400,
        data: {}
      });
    }
  },

  // Verify Token
  verifyToken: async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      logger.debug('Verifying token');

      const decodedToken = await adminAuth.verifyIdToken(token);
      logger.info('Token verified:', { uid: decodedToken.uid });

      const userRecord = await adminAuth.getUser(decodedToken.uid);
      const dbUser = await UserModel.findOne({ firebaseUid: decodedToken.uid });

      res.json({
        error: null,
        success: true,
        message: 'Token verified successfully',
        code: 200,
        data: {
          user: dbUser,
          firebaseUser: userRecord
        }
      });
    } catch (error) {
      logger.error('Token verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';

      res.status(401).json({
        error: errorMessage,
        success: false,
        message: 'Invalid token',
        code: 401,
        data: {}
      });
    }
  }
};
