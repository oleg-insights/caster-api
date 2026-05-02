import type { CurrentUser } from './currentUser.js'

declare global {
    namespace Express {
        interface Request {
            user?: CurrentUser
        }
    }
}