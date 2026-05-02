import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'

import * as UsersService from './users.service.js'

import { AppError } from '../utils/appError.util.js'
import { generateTokens } from '../utils/jwt.util.js'

export interface IRegisterUser {
    name: string
    email: string
    password: string
}

export const registerUser = async (data: IRegisterUser) => {
    const userWithTargetEmail = await prisma.user.findUnique({ where: { email: data.email } })
    
    if (userWithTargetEmail) throw new AppError(409, 'Provided email already in use')
    
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await UsersService.createUser({
        ...data,
        password: hashedPassword
    })

    return user
}

export interface ILoginUser {
    email: string
    password: string
    userAgent: string | null
    ip: string | null
}

export const loginUser = async (data: ILoginUser) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email }
    })

    if (!user) throw new AppError(401, 'Invalid Credentials')

    const hashedPassword = user.password
    const isMatch = await bcrypt.compare(data.password, hashedPassword)

    if (!isMatch) throw new AppError(401, 'Invalid Credentials')

    const { accessToken, refreshToken, expiresAt } = generateTokens(user.id, user.role)

    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt,
            userAgent: data.userAgent,
            ip: data.ip
        }
    })
    
    return { user, accessToken, refreshToken }
}

export const refreshToken = async (refreshToken: string, userAgent: string | null, ip: string | null) => {
    try {
        
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!)

    } catch (error) {
        
        await prisma.session.deleteMany({ where: { refreshToken } })
        throw new AppError(401, 'Invalid refresh token')

    }
    
    const session = await prisma.session.findFirst({
        where: { refreshToken: refreshToken },
        include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
        if (session) {
            await prisma.session.delete({ where: { id: session.id } })
        }
        
        throw new AppError(401, 'Session invalid or expired')
    }

    const { accessToken, refreshToken: newRefreshToken, expiresAt } = generateTokens(session.userId, session.user.role)

    await prisma.session.delete({ where: { id: session.id } })
    await prisma.session.create({
        data: {
            userId: session.userId,
            refreshToken: newRefreshToken,
            expiresAt,
            userAgent,
            ip
        }
    })

    return { accessToken, refreshToken: newRefreshToken }
}

export const logoutUser = async (refreshToken: string, accessToken: string) => {
    if (!accessToken) {
        throw new AppError(401, 'Access token is missing')
    }

    const decoded = jwt.decode(accessToken) as { exp: number } | null

    if (!decoded || !decoded.exp) throw new AppError(400, 'Access token is invalid')

    const secondsUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000)

    if (secondsUntilExpiry > 0) {
        await redis.set(`blacklist:${accessToken}`, '1', 'EX', secondsUntilExpiry)
    }
    
    await prisma.session.deleteMany({ where: { refreshToken } })
}