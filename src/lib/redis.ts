import { Redis } from 'ioredis'

const redisUrl = process.env.REDIS_URL

export const redis = redisUrl
    ? new Redis(redisUrl)
    : new Redis({
        host: 'localhost',
        port: 6379
    })