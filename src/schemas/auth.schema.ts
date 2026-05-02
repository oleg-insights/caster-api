import { z } from 'zod'

export const registerAuthSchema = z.object({
    body: z.object({
        name: z.string()
            .trim()
            .min(3, 'Имя должно содержать не менее 3 символов')
            .max(50, 'Имя должно содержать не более 50 символов'),
        email: z.string()
            .trim()
            .toLowerCase()
            .email(),
        password: z.string()
            .min(8, 'Пароль должен содержать не менее 8 символов')
            .max(20, 'Пароль должен содержать не более 20 символов')
    })
})

export const loginAuthSchema = z.object({
    body: z.object({
        email: z.string()
            .trim()
            .toLowerCase()
            .email(),
        password: z.string()
            .min(1, 'Пароль обязателен')
    })
})