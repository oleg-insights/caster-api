import { AppError } from '../utils/appError.util.js'

import type { Request, Response, NextFunction } from 'express'

export const restrictTo = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError(401, 'You are not authorized'))
        } 

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(403, 'Do not have permissions to perform this action'))
        }

        next()
    }
}