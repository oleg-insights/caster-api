import * as AuthService from '../services/auth.service.js'
import { registerAuthSchema, loginAuthSchema } from '../schemas/auth.schema.js'

import { toUserPrivateDto } from '../mappers/user.mapper.js'
import { AppError } from '../utils/appError.util.js'

import type { Request, Response } from 'express'

export const register = async (req: Request, res: Response) => {
    const validated = registerAuthSchema.parse(req)
    const dataForService: AuthService.IRegisterUser = validated.body
    
    const user = await AuthService.registerUser(dataForService)

    res.status(201).json({ success: true, data: { 
        user: toUserPrivateDto(user) 
    } })
}

export const login = async (req: Request, res: Response) => {
    const validated = loginAuthSchema.parse(req)
    const dataForService: AuthService.ILoginUser = {
        ...validated.body,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null
    }

    const result = await AuthService.loginUser(dataForService)
    const { user, accessToken, refreshToken } = result

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
    })

    res.json({ success: true, data: { 
        user: toUserPrivateDto(user), 
        accessToken 
    } })
}

export const refresh = async (req: Request, res: Response) => {
    const cookieRefreshToken = req.cookies.refreshToken

    if (!cookieRefreshToken) throw new AppError(401, 'Token is missing')

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    })

    const userAgent = req.headers['user-agent'] || null
    const ip = req.ip || null

    const result = await AuthService.refreshToken(cookieRefreshToken, userAgent, ip)
    const { accessToken, refreshToken } = result

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
    })

    res.status(201).json({ success: true, data: { 
        accessToken 
    } })
}

export const logout = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'Access token is missing')
    }

    const accessToken = authHeader.split(' ')[1] as string
    
    const { refreshToken } = req.cookies || {}

    if (refreshToken) {
        await AuthService.logoutUser(refreshToken, accessToken)
    }
    
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    })

    res.status(204).end()
}