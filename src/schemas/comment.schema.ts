import { z } from 'zod'

// Редактировать комментарий
export const updateCommentSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    }),
    body: z.object({
        text: z.string()
            .min(3, 'Комментарий должен содержать минимум 3 символа')
            .max(500, 'Комментарий не должен превышать 500 символов')
            .optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'Для редактирования комментария нужно передать хотя бы одно поле'
    })
})

// Удалить комментарий
export const removeCommentSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    })
})

// Поставить лайк
export const createCommentLikeSchema = z.object({ 
    params: z.object({
        id: z.string().cuid()
    }) 
})

// Удалить лайк
export const removeCommentLikeSchema = z.object({ 
    params: z.object({
        id: z.string().cuid()
    }) 
})