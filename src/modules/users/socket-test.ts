import { io as SocketClient } from 'socket.io-client';

async function testUserSockets() {
  const socket = SocketClient('http://localhost:3000', {
    path: '/socket/user'
  });

  // Connection event
  socket.on('connect', () => {
    console.log('Connected to user socket server');
  });

  // Error handling
  socket.on('connect_error', (error: Error) => {
    console.error('Connection error:', error);
  });

  // Example: Get all users
  socket.emit('getMany', JSON.stringify({
    query: {
      select: { name: 1, email: 1, role: 1 }
    }
  }));

  // Listen for getMany response
  socket.on('getMany:response', (response: any) => {
    console.log('Users retrieved:', response);
  });

  // Example: Get one user by ID
  socket.emit('getOneById', JSON.stringify({
    _id: 'user-id-here',
    query: {
      select: { name: 1, email: 1, role: 1 }
    }
  }));

  // Listen for getOneById response
  socket.on('getOneById:response', (response: any) => {
    console.log('User retrieved:', response);
  });

  // Example: Update user
  socket.emit('updateById', JSON.stringify({
    _id: 'user-id-here',
    body: {
      name: 'Updated Name'
    }
  }));

  // Listen for updateById response
  socket.on('updateById:response', (response: any) => {
    console.log('User updated:', response);
  });

  // Example: Join a room
  socket.emit('join:room', 'users-room');
  socket.on('join:room:response', (response: any) => {
    console.log('Room joined:', response);
  });

  // Example: Leave a room
  socket.emit('leave:room', 'users-room');
  socket.on('leave:room:response', (response: any) => {
    console.log('Room left:', response);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Disconnected from user socket server');
  });
}

// Run the test
testUserSockets().catch(console.error);
