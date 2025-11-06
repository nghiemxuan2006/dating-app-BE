import Redis, { RedisOptions } from "ioredis";
import settings from "./env";

const baseOptions: RedisOptions = {
    host: settings.HOST,
    port: Number(settings.REDIS_PORT),
};

// General-purpose client for standard commands (GET/SET/LIST/etc.)
const redis = new Redis(baseOptions);

// Dedicated clients for pub/sub. These must NOT be used for normal commands.
const publisher = new Redis(baseOptions);
const subscriber = new Redis(baseOptions);

// Helpers to create additional isolated clients when needed (e.g., module-scoped subscribers)
export const newSubscriber = () => new Redis(baseOptions);
export const newPublisher = () => new Redis(baseOptions);

export { redis, publisher, subscriber };