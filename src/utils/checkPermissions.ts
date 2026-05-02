import { AppError } from './appError.util.js'

import type { CurrentUser } from '../types/currentUser.js'

export const checkPermissions = (ownerId: string, currentUser: CurrentUser, msg: string) => {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== ownerId) {
        throw new AppError(403, msg)
    }
}