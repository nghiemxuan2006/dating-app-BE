import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { MatchingRequest, MatchResult, publishMatchingRequest, startMatchResultSubscriber } from '../services/matching.service';
import logger from '../utils/matching-worker-log';
import { BAD_REQUEST_ERROR } from '../utils/error';
import { UserInfo } from '../models/user';

let io: Server | null = null;
const mappingUserSocket = new Map<string, string>(); // userId -> socketId

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

        socket.on('disconnect', () => {
            const userId = socket.data.userId;
            if (userId) {
                mappingUserSocket.delete(userId);
                logger.info(`User ${userId} disconnected and removed from mapping.`);
            }
        });
        socket.on('matching', async (data) => {
            const userId = data.userId;
            if (!userId) {
                throw new BAD_REQUEST_ERROR('userId is required');
            }

            mappingUserSocket.set(userId, socket.id);

            // Fetch user profile from database
            const userProfile = await UserInfo.findOne({ account: userId }).populate('account');

            if (!userProfile) {
                throw new BAD_REQUEST_ERROR('User profile not found');
            }

            // Prepare matching request
            const matchingRequest: MatchingRequest = {
                userId: userId,
                userInfo: userProfile,
                timestamp: Date.now()
            };

            // Publish matching request to Redis
            await publishMatchingRequest(matchingRequest);
        })
    });

    // Subscribe to socket events from other processes
    // Start the match result subscriber for logging and notifications
    startMatchResultSubscriber(async (matchResult: MatchResult) => {
        logger.info(`🎉 MATCH FOUND! User ${matchResult.user1} matched with User ${matchResult.user2}`);
        logger.info(`💕 Compatibility Score: ${matchResult.compatibility_score}%`);
        logger.info(`⏰ Matched at: ${new Date(matchResult.matched_at).toISOString()}`);

        // Here you can add additional logic like:
        // - Send notifications to matched users
        // - Create match records in database
        // - Trigger other services
        // - Send webhooks

        console.log('Mapping User Sockets:', mappingUserSocket);
        // Emit match result to both users if they are connected
        const socketId1 = mappingUserSocket.get(matchResult.user1);
        const socketId2 = mappingUserSocket.get(matchResult.user2);

        const socket1 = socketId1 ? io.sockets.sockets.get(socketId1) : null;
        const socket2 = socketId2 ? io.sockets.sockets.get(socketId2) : null;
        if (socket1 && socket2) {
            const room = `match:${matchResult.user1}:${matchResult.user2}}`;
            socket1.join(room);
            socket2.join(room);
            io.to(room).emit('match_found', room);
            logger.info(`Emitted match_found to room ${room}`);
        } else {
            logger.info(`One or both users are not connected. user1 socket: ${socketId1}, user2 socket: ${socketId2}`);
            // Handle case where one or both users are not connected
            // if (!socket1) {
            //     await removeUserFromWaitingList(matchResult.user1);
            // }
            // if (!socket2) {
            //     await removeUserFromWaitingList(matchResult.user2);
            // }
        }
    });

    logger.info('Match result subscriber started');
    logger.info('🚀 Matching worker is ready and listening for matching requests...');
}

export function emitToUser(userId: string, event: string, payload: any) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
}

export { SOCKET_EVENTS_CHANNEL };
