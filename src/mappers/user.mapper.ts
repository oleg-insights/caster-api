import type { User } from '@prisma/client'

export const toUserPublicDto = (user: User) => {
    return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt 
    }
}
export type UserPublicDto = ReturnType<typeof toUserPublicDto>

export const toUserPrivateDto = (user: User) => {
    return {
        ...toUserPublicDto(user),
        email: user.email,
        telegramId: user.telegramId,
        telegramNotifications: user.telegramNotifications,
        updatedAt: user.updatedAt
    }
}
export type UserPrivateDto = ReturnType<typeof toUserPrivateDto>