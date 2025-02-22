import { Server, Socket } from 'socket.io';
import { ApiatoSocket } from '../../libs/apiato/no-sql/apiato-socket';
import { UserModel } from './model';
import { UserRole } from '../../types/user';

export class UserSocket extends ApiatoSocket {
  constructor(io: Server) {
    // Middleware to check user permissions
    const middleware = async ({ operation, socket, data }: { operation: string; socket: Socket; data: any }) => {
      try {
        const user = socket.data.user;
        
        // If no user data, only allow read operations
        if (!user) {
          return ['getMany', 'getOneWhere', 'getOneById'].includes(operation);
        }

        // Admin can do everything
        if (user.role === UserRole.ADMIN) {
          return true;
        }

        // Users can only read and update their own data
        if (user.role === UserRole.USER) {
          switch (operation) {
            case 'getMany':
            case 'getOneWhere':
            case 'getOneById':
              return true;
            case 'updateById':
              return data._id === user._id;
            default:
              return false;
          }
        }

        // Public users can only read
        return ['getMany', 'getOneWhere', 'getOneById'].includes(operation);
      } catch (error) {
        console.error('Socket middleware error:', error);
        return false;
      }
    };

    super(io, UserModel, middleware);
  }
}
