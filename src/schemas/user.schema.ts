import { z } from 'zod'

// Получить пользователя по id
export const findUserByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    })
})

// Изменить профиль пользователя
export const updateUserSchema = z.object({
    body: z.object({
        name: z.string()
            .min(3, 'Имя должно содержать не менее 3 символов')
            .max(50, 'Имя должно содержать не более 50 символов')
            .optional(),
        email: z.string().email().optional(),
        avatar: z.string().max(500).url().regex(/.+\.(jpg|png|gif)$/).nullable().optional(),
        telegramNotifications: z.boolean().optional(),
        telegramId: z.string().min(5).max(15).nullable().optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'Для редактирования профиля нужно передать хотя бы одно поле'
    })
})

// Изменить пароль пользователя
export const updateUserPasswordSchema = z.object({
    body: z.object({
        password: z.string()
            .min(5, 'Пароль должен содержать не менее 5 символов')
            .max(50, 'Пароль должен содержать не более 50 символов'),
        oldPassword: z.string()
            .min(1, 'Старый пароль должен содержать хотя бы 1 символ')
    })
})

// Удалить пользователя
export const removeUserSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    })
})

// Получить комментарии пользователя
export const findUserCommentsSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    }),
    query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.enum(['createdAt']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc')
    })
})

// Получить лайки текущего пользователя
export const findCurrentUserLikesSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.enum(['createdAt']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc')
    })
})

// Получить подписки текущего пользователя
export const findCurrentUserSubscriptionsSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.enum(['createdAt']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc')
    })
})

// Подписаться на канал
export const subscribeToChannelSchema = z.object({
    body: z.object({
        channelId: z.string().cuid()
    })
})

// Отменить подписку
export const removeUserSubscriptionSchema = z.object({
    params: z.object({
        channelId: z.string().cuid()
    })
})