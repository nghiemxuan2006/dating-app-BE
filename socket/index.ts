import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { MatchingRequest, MatchResult, publishMatchingRequest, removeUserFromWaitingList, startMatchResultSubscriber } from '../services/matching.service';
import logger from '../utils/matching-worker-log';
import { BAD_REQUEST_ERROR } from '../utils/error';
import { UserInfo } from '../models/user';
import { Match } from '../models/match';
import { getSocketByUserId } from '../utils/socket';
import { redis } from '../config/redis';
import zimService from '../services/zim.service';
import Redis from 'ioredis';

let io: Server | null = null;
const mappingUserSocket = new Map<string, string>(); // userId -> socketId

const SOCKET_EVENTS_CHANNEL = 'socket_events';

const deleteRemaingData = async (type: string, socketId: string, currentUserId: string, redis: Redis) => {
    try {
        const key = `recent_matches:${type}:${socketId}`;
        const partnerInfo = JSON.parse(await redis.get(key));
        const partnerSocketId = partnerInfo.socketId;
        const res = await zimService.deleteConversation({
            FromUserId: currentUserId,
            ConvId: partnerInfo.id,
            ConvType: 0
        });
        const res2 = await zimService.deleteAllMessage({
            FromUserId: currentUserId,
            ToUserId: partnerInfo.id
        });
        await redis.del(key);
        await redis.del(`recent_matches:${type}:${partnerSocketId}`);
        io.to(partnerSocketId).emit('cancel', { message: 'Your chat partner has disconnected.' });
    } catch (error) {
        console.error('Error deleting remaining data:', type, error);
    }
}

export function initSocket(server: HTTPServer) {
    io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    // Middleware for socket authentication
    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        console.log("🚀 ~ initSocket ~ userId:", userId)

        socket.data.userId = userId;
        next();
    });

    io.on('connection', (socket) => {
        // Client should send its userId after connect to map socket <-> user
        socket.on('register', (userId: string) => {
            socket.data.userId = userId;
            socket.join(`user:${userId}`);
        });

        socket.on('disconnect', async () => {
            const socketId = socket.id;
            const currentUserId = socket.data.userId;
            logger.info(`Socket disconnected: ${socketId}`);
            deleteRemaingData('chat', socketId, currentUserId, redis);
            deleteRemaingData('call', socketId, currentUserId, redis);
        });

        socket.on('cancel_matching', async (type: string) => {
            const userId = socket.data.userId;
            if (!userId) {
                throw new BAD_REQUEST_ERROR('userId is required');
            }
            logger.info(`User ${userId} requested to cancel matching.`);
            // Here you can add logic to remove the user from the matching queue
            // For example, you might publish a cancel event to Redis or update a database record
            await removeUserFromWaitingList(userId, type);
        });
        socket.on('matching', async (type: string) => {

            console.log('🚀 ~ socket.on ~ matching event received from socket:', socket.id);
            const userId = socket.data.userId;
            if (!userId) {
                throw new BAD_REQUEST_ERROR('userId is required');
            }

            // Fetch user profile from database
            const userProfile = await UserInfo.findOne({ account: userId }).populate('account');

            if (!userProfile) {
                throw new BAD_REQUEST_ERROR('User profile not found');
            }

            // Prepare matching request
            const matchingRequest: MatchingRequest = {
                userId: userId,
                socketId: socket.id,
                userInfo: userProfile,
                timestamp: Date.now(),
                type: type
            };
            console.log("🚀 ~ initSocket ~ matchingRequest:", matchingRequest)

            // Publish matching request to Redis
            await publishMatchingRequest(matchingRequest);
        })
        socket.on('approve', async (data) => {
            const currentUserId = socket.data.userId;
            const { userId, isApprove, type } = data;
            if (!currentUserId || !userId) {
                throw new BAD_REQUEST_ERROR('userId is required');
            }

            // 
            const matchInfo = await Match.findOne({
                $or: [
                    { userid1: currentUserId, userid2: userId },
                    { userid1: userId, userid2: currentUserId }
                ]
            });
            if (!matchInfo) {
                throw new BAD_REQUEST_ERROR('Match info not found');
            }
            if (matchInfo.userid1.toString() === currentUserId) {
                matchInfo.user1like = isApprove;
            } else if (matchInfo.userid2.toString() === currentUserId) {
                matchInfo.user2like = isApprove;
            }
            if (!isApprove) {
                matchInfo.status = "CANCELED"
            }
            if (matchInfo.user1like && matchInfo.user2like) {
                matchInfo.status = 'APPROVED'
            }
            await matchInfo.save();

            // const partnerSocket = getSocketByUserId(userId, io, mappingUserSocket);
            const key = `recent_matches:${type}:` + socket.id;
            const partnerInfo = JSON.parse(await redis.get(key));
            const partnerSocketId = partnerInfo.socketId;

            let event = '';
            let message = '';
            let partnerMessage = '';
            if (matchInfo.status === "APPROVED") {
                event = 'matched';
                message = 'You two can continue talking.';
                partnerMessage = 'You two can continue talking.';
                logger.info(`It's a match between ${matchInfo.userid1} and ${matchInfo.userid2}`);
                await redis.del(key);
                await redis.del(`recent_matches:${type}:` + partnerSocketId);

                // Here you can add additional logic like sending notifications, etc.
            } else if (matchInfo.status === "MATCHING") {
                event = 'like_received';
                message = 'You have liked';
                partnerMessage = 'Partner liked you.';
            } else if (matchInfo.status === "CANCELED") {
                event = 'cancel'
                message = 'Conversation will be canceled'
                partnerMessage = 'Conversation will be canceled'
                await redis.del(key);
                await redis.del(`recent_matches:${type}:` + partnerSocketId);
            }

            socket.emit(event, { message });
            io.to(partnerSocketId).emit(event, { message: partnerMessage });
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
        const socketId1 = matchResult.user1.socketId;
        const socketId2 = matchResult.user2.socketId;

        const socket1 = socketId1 ? io.sockets.sockets.get(socketId1) : null;
        const socket2 = socketId2 ? io.sockets.sockets.get(socketId2) : null;
        if (socket1 && socket2) {
            const room = `match_${matchResult.user1.id}_${matchResult.user2.id}`;
            await new Promise(resolve => setTimeout(resolve, 5000));
            if (matchResult.type === 'chat') {
                Promise.all([
                    io.to(socketId1).emit('match_found', matchResult.user2),
                    io.to(socketId2).emit('match_found', matchResult.user1)
                ]);
            } else if (matchResult.type === 'call') {
                Promise.all([
                    io.to(socketId1).emit('match_found', { room, user: matchResult.user2 }),
                    io.to(socketId2).emit('match_found', { room, user: matchResult.user1 })
                ]);
            }
            // socket1.join(room);
            // socket2.join(room);
            // io.to(room).emit('match_found', room);
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
