import { Request, Response } from 'express';
import { UserModel, IUser } from './model';
import { UserRole } from '../../types/user';

interface ApiError {
  message: string;
  [key: string]: any;
}

export class UserController {
  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          success: false,
          message: 'User not found',
          code: 404,
          data: {}
        });
      }

      await (user as IUser).updateLastLogin();

      return res.status(200).json({
        error: {},
        success: true,
        message: 'Last login updated successfully',
        code: 200,
        data: user
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error as ApiError,
        success: false,
        message: error.message,
        code: 500,
        data: {}
      });
    }
  }

  /**
   * Get user by Firebase UID
   */
  static async getByFirebaseUid(req: Request, res: Response) {
    try {
      const { firebaseUid } = req.params;
      const user = await UserModel.findOne({ firebaseUid });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          success: false,
          message: 'User not found',
          code: 404,
          data: {}
        });
      }

      return res.status(200).json({
        error: {},
        success: true,
        message: 'User found',
        code: 200,
        data: user
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error as ApiError,
        success: false,
        message: error.message,
        code: 500,
        data: {}
      });
    }
  }

  /**
   * Update user's email verification status
   */
  static async updateEmailVerification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { emailVerified } = req.body;

      if (typeof emailVerified !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid input',
          success: false,
          message: 'emailVerified must be a boolean',
          code: 400,
          data: {}
        });
      }

      const user = await UserModel.findByIdAndUpdate(
        id,
        { emailVerified },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          success: false,
          message: 'User not found',
          code: 404,
          data: {}
        });
      }

      return res.status(200).json({
        error: {},
        success: true,
        message: 'Email verification status updated successfully',
        code: 200,
        data: user
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error as ApiError,
        success: false,
        message: error.message,
        code: 500,
        data: {}
      });
    }
  }

  /**
   * Update user's role
   */
  static async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          success: false,
          message: `Role must be one of: ${Object.values(UserRole).join(', ')}`,
          code: 400,
          data: {}
        });
      }

      const user = await UserModel.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          success: false,
          message: 'User not found',
          code: 404,
          data: {}
        });
      }

      return res.status(200).json({
        error: {},
        success: true,
        message: 'User role updated successfully',
        code: 200,
        data: user
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error as ApiError,
        success: false,
        message: error.message,
        code: 500,
        data: {}
      });
    }
  }
}
