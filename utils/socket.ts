import { Server } from "socket.io";


export const getSocketByUserId = (userId: string, io: Server, mappingUserSocket: Map<string, string>) => {
    const socketId = mappingUserSocket.get(userId);
    if (!socketId) return null;
    return io.sockets.sockets.get(socketId);
};
