import { ZodError } from 'zod'

import { Prisma } from '@prisma/client'

import { AppError } from '../utils/appError.util.js'

import type { Request, Response, NextFunction } from 'express'

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Zod
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Validation Error',
            errors: error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        })
    }

    // Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // unique relation
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                status: 409,
                code: 'ALREADY_EXISTS',
                message: 'Resource already exists'
            })
        }

        // not found
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                status: 404,
                code: 'NOT_FOUND',
                message: 'Resource not found'
            })
        }
    }

    // JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Invalid token'
        })
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Token has expired'
        })
    }

    // AppError
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            status: error.statusCode,
            code: error.code,
            message: error.message
        })
    }

    // Unknown
    console.error(`${req.method} ${req.path} >> Status: 500 >> Error: ${error.message}`)

    return res.status(500).json({
        success: false,
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal Server Error'
    })
} 