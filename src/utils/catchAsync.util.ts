import type { Request, Response, NextFunction } from 'express'

export const catchAsync = (ctrlFn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        ctrlFn(req, res, next).catch(next)
    }
}