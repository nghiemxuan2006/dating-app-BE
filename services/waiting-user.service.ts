import redis from '../config/redis';

const WAITING_USERS_KEY = 'waiting_users';

export interface WaitingUser {
    userId: string;
    profile: Record<string, any>;
}

export async function addWaitingUser(user: WaitingUser) {
    await redis.rpush(WAITING_USERS_KEY, JSON.stringify(user));
}

export async function getWaitingUsers(): Promise<WaitingUser[]> {
    const users = await redis.lrange(WAITING_USERS_KEY, 0, -1);
    return users.map((u) => JSON.parse(u));
}

export async function popWaitingUser(): Promise<WaitingUser | null> {
    const user = await redis.lpop(WAITING_USERS_KEY);
    return user ? JSON.parse(user) : null;
}

export default redis;
