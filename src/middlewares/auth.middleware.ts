import jwt from 'jsonwebtoken'

import { redis } from '../lib/redis.js'

import { AppError } from '../utils/appError.util.js'

import type { Request, Response, NextFunction } from 'express'

const getDecodedUser = async (req: Request) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return null

    const token = authHeader.split(' ')[1]
    if (!token) return null

    try {
        const isRevoked = await redis.get(`blacklist:${token}`)
        if (isRevoked) return null
    } catch (error) {
        console.error('Redis error:', error)
    }

    const secret = process.env.JWT_ACCESS_SECRET!

    try { 
        const decodedUser = jwt.verify(token, secret) as { id: string, role: 'ADMIN' | 'USER' }
        return decodedUser
    } catch {
        return null
    }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = await getDecodedUser(req)

    if (!decodedUser) {
        return next(new AppError(401, 'Access token is missing, invalid or revoked'))
    }

    req.user = decodedUser
    next()
}

export const tryAuth = async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = await getDecodedUser(req)

    if (decodedUser) {
        req.user = decodedUser
    }

    next()
}