import { z } from 'zod'

// Получить все каналы
export const findAllChannelsSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc')
    })
})

// Получить канал по id
export const findChannelByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    })
})

// Создать канал
export const createChannelSchema = z.object({
    body: z.object({
        title: z.string()
            .min(3, 'Название должно быть не меньше 3 символов')
            .max(30, 'Название должно быть не более 30 символов')
    })
})

// Отредактировать канал
export const updateChannelSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        title: z.string()
            .min(3, 'Название должно быть не меньше 3 символов')
            .max(30, 'Название должно быть не более 30 символов')
            .optional(),
        description: z.string()
            .min(3, 'Описание должно быть не меньше 3 символов')
            .max(300, 'Описание должно быть не более 300 символов')
            .nullable()
            .optional(),
        avatar: z.string().url().regex(/.+\.(jpg|png|gif)$/i, 'Недопустимое расширение аватара').nullable().optional(),
        banner: z.string().url().regex(/.+\.(jpg|png|gif)$/i, 'Недопустимое расширение баннера').nullable().optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'Для редактирования канала нужно передать хотя бы одно поле'
    })
})

// Удалить канал
export const removeChannelSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    })
})

// Получить подписчиков
export const findSubscribersSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    }),
    query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc')
    })
})