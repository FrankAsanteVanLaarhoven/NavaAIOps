import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { db } from './db';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    path: '/socket.io',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a channel
    socket.on('join-channel', async (data: { channelId: string; userId: string }) => {
      const { channelId, userId } = data;
      socket.join(`channel:${channelId}`);
      
      // Emit channel info
      socket.emit('channel-joined', { channelId });
      
      // Notify others in channel
      socket.to(`channel:${channelId}`).emit('user-joined-channel', { userId });
    });

    // Join a thread
    socket.on('join-thread', async (data: { threadId: string; userId: string }) => {
      const { threadId, userId } = data;
      socket.join(`thread:${threadId}`);
      
      socket.emit('thread-joined', { threadId });
      socket.to(`thread:${threadId}`).emit('user-joined-thread', { userId });
    });

    // Typing indicator
    socket.on('typing', (data: { threadId: string; userId: string; userName: string }) => {
      socket.to(`thread:${data.threadId}`).emit('user-typing', {
        userId: data.userId,
        userName: data.userName,
        threadId: data.threadId,
      });
    });

    socket.on('stop-typing', (data: { threadId: string; userId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('user-stopped-typing', {
        userId: data.userId,
        threadId: data.threadId,
      });
    });

    // New message
    socket.on('new-message', async (data: { threadId: string; message: any }) => {
      // Broadcast to all users in the thread
      io?.to(`thread:${data.threadId}`).emit('message-received', {
        threadId: data.threadId,
        message: data.message,
      });
    });

    // Canvas collaboration
    socket.on('canvas-update', (data: { threadId: string; content: any; userId: string }) => {
      // Broadcast canvas updates to all users in thread
      socket.to(`thread:${data.threadId}`).emit('canvas-update', {
        threadId: data.threadId,
        content: data.content,
        userId: data.userId,
      });
    });

    socket.on('canvas-collaborate', (data: { threadId: string; userId: string; userName: string }) => {
      // Notify others that user is collaborating
      socket.to(`thread:${data.threadId}`).emit('canvas-collaborator', {
        userId: data.userId,
        userName: data.userName,
        threadId: data.threadId,
      });
    });

    // Voice notes
    socket.on('voice-note-start', (data: { threadId: string; userId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('user-recording-voice', {
        userId: data.userId,
        threadId: data.threadId,
      });
    });

    socket.on('voice-note-end', (data: { threadId: string; userId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('user-stopped-recording', {
        userId: data.userId,
        threadId: data.threadId,
      });
    });

    // Presence
    socket.on('update-presence', (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
      socket.broadcast.emit('presence-updated', {
        userId: data.userId,
        status: data.status,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeWebSocket first.');
  }
  return io;
}
