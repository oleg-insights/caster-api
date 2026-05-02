import type { JwtPayload } from 'jsonwebtoken'

export interface CurrentUser extends JwtPayload {
    id: string
    role: 'ADMIN' | 'USER'
}