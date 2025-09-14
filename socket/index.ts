import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: Server | null = null;

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
}

export function emitToUser(userId: string, event: string, payload: any) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
}
