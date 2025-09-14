import Redis from "ioredis";
import settings from "./env";

const redis = new Redis({
    host: settings.HOST,
    port: Number(settings.REDIS_PORT),
});

export default redis;