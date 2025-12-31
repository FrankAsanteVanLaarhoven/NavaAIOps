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
  
  // Use refs for callbacks to avoid dependency issues
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onStopTypingRef = useRef(onStopTyping);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onStopTypingRef.current = onStopTyping;
  }, [onMessage, onTyping, onStopTyping]);

  useEffect(() => {
    // Only connect on client-side
    if (typeof window === 'undefined') return;
    if (!user) return;

    // Connect to WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
      setIsConnected(false);
      // Don't throw - just log and continue without WebSocket
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
      onMessageRef.current?.(data.message);
    });

    socket.on('user-typing', (data: { userId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.userId, { userId: data.userId, userName: data.userName });
        return newMap;
      });
      onTypingRef.current?.(data);
    });

    socket.on('user-stopped-typing', (data: { userId: string }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      onStopTypingRef.current?.(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, channelId, threadId]); // Only depend on IDs, not functions

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
