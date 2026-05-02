import { z } from 'zod'

// Получить список пользователей
export const findUsersSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.enum(['createdAt', 'name', 'role', 'email']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc')
    })
})

// Изменить роль пользователя
export const changeUserRoleSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    }),
    body: z.object({
        role: z.enum(['USER', 'ADMIN'])
    })
})