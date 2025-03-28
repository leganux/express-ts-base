import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { UserSocket } from './socket';

export function initializeUserSockets(server: Server): void {
  const io = new SocketServer(server, {
    path: '/socket/user',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Initialize user socket handlers
  new UserSocket(io);
}
