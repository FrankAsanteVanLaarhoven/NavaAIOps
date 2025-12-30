'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/app/state/user-context';

interface UseWebSocketOptions {
  channelId?: string;
  threadId?: string;
  onMessage?: (message: any) => void;
  onTyping?: (data: { userId: string; userName: string }) => void;
  onStopTyping?: (data: { userId: string }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { channelId, threadId, onMessage, onTyping, onStopTyping } = options;
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, { userId: string; userName: string }>>(new Map());

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Join channel if provided
    if (channelId) {
      socket.emit('join-channel', {
        channelId,
        userId: user.id,
      });
    }

    // Join thread if provided
    if (threadId) {
      socket.emit('join-thread', {
        threadId,
        userId: user.id,
      });
    }

    // Message handlers
    socket.on('message-received', (data: { message: any }) => {
      onMessage?.(data.message);
    });

    socket.on('user-typing', (data: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.userId, { userId: data.userId, userName: data.userName });
        return newMap;
      });
      onTyping?.(data);
    });

    socket.on('user-stopped-typing', (data: { userId: string }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      onStopTyping?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, channelId, threadId, onMessage, onTyping, onStopTyping]);

  const sendTyping = useCallback(() => {
    if (socketRef.current && threadId && user) {
      socketRef.current.emit('typing', {
        threadId,
        userId: user.id,
        userName: user.name || user.email,
      });
    }
  }, [threadId, user]);

  const sendStopTyping = useCallback(() => {
    if (socketRef.current && threadId && user) {
      socketRef.current.emit('stop-typing', {
        threadId,
        userId: user.id,
      });
    }
  }, [threadId, user]);

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && threadId) {
      socketRef.current.emit('new-message', {
        threadId,
        message,
      });
    }
  }, [threadId]);

  return {
    socket: socketRef.current,
    isConnected,
    typingUsers: Array.from(typingUsers.values()),
    sendTyping,
    sendStopTyping,
    sendMessage,
  };
}
