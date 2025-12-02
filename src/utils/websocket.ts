import { Server as SocketIOServer } from 'socket.io';

/**
 * WebSocket utility functions
 * Handles real-time notifications for job updates
 */

let ioInstance: SocketIOServer | null = null;

/**
 * Initialize WebSocket server instance
 * @param io - Socket.IO server instance
 */
export const initializeWebSocket = (io: SocketIOServer): void => {
  ioInstance = io;
};

/**
 * Emit job update to subscribed clients
 * @param jobId - Job ID to notify about
 * @param data - Update data to send
 */
export const emitJobUpdate = (jobId: string, data: any): void => {
  if (!ioInstance) {
    console.warn('WebSocket server not initialized');
    return;
  }

  ioInstance.to(`job-${jobId}`).emit('job-update', {
    jobId,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

