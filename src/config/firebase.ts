import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { cert, initializeApp as initializeAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { validateEnv } from './env.validator';
import { logger } from '../utils/logger';


const config = validateEnv();

// Firebase Web SDK Configuration
const firebaseConfig = {
  apiKey: config.FIREBASE_API_KEY,
  authDomain: config.FIREBASE_AUTH_DOMAIN,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_APP_ID,
  measurementId: config.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase Web SDK
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    logger.info('Firebase Web SDK initialized successfully');
  } else {
    app = getApp();
  }
} catch (error) {
  logger.error('Error initializing Firebase Web SDK:', error);
  throw error;
}

export const auth = getAuth(app);

// Initialize Firebase Admin SDK
try {
  if (getAdminApps().length === 0) {

    logger.debug('Service account loaded successfully');

    const adminApp = initializeAdminApp({
      credential: cert({
        projectId: config.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: config.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: config.FIREBASE_ADMIN_PRIVATE_KEY
      }),
      projectId: config.FIREBASE_ADMIN_PROJECT_ID,
      databaseURL: `https://${config.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
    });

    logger.info('Firebase Admin SDK initialized successfully with project:', config.FIREBASE_ADMIN_PROJECT_ID);
  }
} catch (error) {
  logger.error('Error initializing Firebase Admin SDK:', error);
  throw error;
}

export const adminAuth = getAdminAuth();

// Custom roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PUBLIC = 'public'
}

// Function to verify Firebase ID token and get user claims
export const verifyToken = async (token: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    logger.debug('Token verified successfully:', { uid: decodedToken.uid });
    return decodedToken;
  } catch (error) {
    logger.error('Error verifying Firebase token:', error);
    throw error;
  }
};

// Function to set custom claims (roles)
export const setUserRole = async (uid: string, role: UserRole) => {
  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    logger.info(`Role ${role} set for user ${uid}`);
  } catch (error) {
    logger.error('Error setting user role:', error);
    throw error;
  }
};

// Function to get user role
export const getUserRole = async (uid: string): Promise<UserRole> => {
  try {
    const user = await adminAuth.getUser(uid);
    const role = (user.customClaims?.role as UserRole) || UserRole.PUBLIC;
    logger.debug('Retrieved user role:', { uid, role });
    return role;
  } catch (error) {
    logger.error('Error getting user role:', error);
    throw error;
  }
};
