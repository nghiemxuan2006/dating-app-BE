import { redis } from '../config/redis';
import { IUserInfo } from '../models/user';

const WAITING_USERS_KEY = 'waiting_users';

export interface WaitingUser {
    userId: string;
    profile: IUserInfo;
    socketId: string;
}

export async function addWaitingUser(user: WaitingUser, type: string) {
    await redis.rpush(`${WAITING_USERS_KEY}:${type}`, JSON.stringify(user));
}

export async function getWaitingUsers(type: string): Promise<WaitingUser[]> {
    const users = await redis.lrange(`${WAITING_USERS_KEY}:${type}`, 0, -1);
    return users.map((u) => JSON.parse(u));
}

export async function popWaitingUser(type: string): Promise<WaitingUser | null> {
    const user = await redis.lpop(`${WAITING_USERS_KEY}:${type}`);
    return user ? JSON.parse(user) : null;
}

