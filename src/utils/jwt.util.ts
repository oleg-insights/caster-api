import jwt from 'jsonwebtoken'

export const generateTokens = (userId: string, role: string, {
    expiresRefreshInDays = 30
} = {}) => {
    const accessSecret = process.env.JWT_ACCESS_SECRET!
    const refreshSecret = process.env.JWT_REFRESH_SECRET!

    const accessToken = jwt.sign({ id: userId, role }, accessSecret, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ id: userId, role }, refreshSecret, { expiresIn: `${expiresRefreshInDays}d` })
    
    const expiresInMs = expiresRefreshInDays * 24 * 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + expiresInMs)

    return { accessToken, refreshToken, expiresAt }
}