import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * useSocket – manages a singleton socket.io connection for a given userId.
 * Automatically joins the user's room and disconnects on unmount.
 */
export function useSocket(userId: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;
    socketRef.current = io();
    socketRef.current.emit('join', userId);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  return socketRef;
}
