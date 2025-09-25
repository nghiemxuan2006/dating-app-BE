import Redis from "ioredis";
import settings from "./env";

const redis = new Redis({
    host: settings.HOST,
    port: Number(settings.REDIS_PORT),
});

// Create separate Redis instances for pub/sub
const publisher = new Redis({
    host: settings.HOST,
    port: Number(settings.REDIS_PORT),
});

const subscriber = new Redis({
    host: settings.HOST,
    port: Number(settings.REDIS_PORT),
});

export { redis, publisher, subscriber };