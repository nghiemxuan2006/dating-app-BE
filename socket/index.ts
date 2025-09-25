import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import Redis from 'ioredis';

let io: Server | null = null;

// Redis subscriber for socket events from other processes
const socketEventSubscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
});

const SOCKET_EVENTS_CHANNEL = 'socket_events';

export function initSocket(server: HTTPServer) {
    io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    io.on('connection', (socket) => {
        // Client should send its userId after connect to map socket <-> user
        socket.on('register', (userId: string) => {
            socket.data.userId = userId;
            socket.join(`user:${userId}`);
        });
    });

    // Subscribe to socket events from other processes
    initSocketEventSubscriber();
}

function initSocketEventSubscriber() {
    socketEventSubscriber.subscribe(SOCKET_EVENTS_CHANNEL, (err, count) => {
        if (err) {
            console.error('Error subscribing to socket events channel:', err);
            return;
        }
        console.log(`Subscribed to socket events channel. Listening for events from other processes...`);
    });

    socketEventSubscriber.on('message', async (channel, message) => {
        if (channel === SOCKET_EVENTS_CHANNEL) {
            try {
                const socketEvent = JSON.parse(message);
                const { userId, event, payload } = socketEvent;

                if (io) {
                    io.to(`user:${userId}`).emit(event, payload);
                    console.log(`Emitted ${event} to user ${userId} via Redis pub/sub`);
                }
            } catch (error) {
                console.error('Error processing socket event message:', error);
            }
        }
    });
}

export function emitToUser(userId: string, event: string, payload: any) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
}

export { SOCKET_EVENTS_CHANNEL };
