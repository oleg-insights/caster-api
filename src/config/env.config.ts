import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
    PORT: z.string().transform(Number),
    DATABASE_URL: z.string().url(),
    DB_USER: z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
    JWT_ACCESS_SECRET: z.string().min(1, 'ACCESS_SECRET is required'),
    JWT_REFRESH_SECRET: z.string().min(1, 'REFRESH_SECRET is required'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    INITIAL_ADMIN_PASSWORD: z.string().min(1),
    TELEGRAM_TOKEN: z.string().optional().or(z.literal("")),
    TG_CHAT_ID: z.string().optional().or(z.literal("")),
    ENABLE_SWAGGER: z.enum(['true', 'false']).default('false'),
    REDIS_URL: z.string().url()
})

const isBuild = process.env.SKIP_ENV_VALIDATION === '1'
const result = envSchema.safeParse(process.env)

if (!result.success && !isBuild) {
    console.error('ENV:', result.error.format())
    process.exit(1)
}

export const env = (result.data || process.env) as z.infer<typeof envSchema>