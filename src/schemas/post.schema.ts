import { z } from 'zod'

// Получить все посты
export const findAllPostsSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
        order: z.enum(['asc', 'desc']).default('desc')
    })
})

// Получить пост по id
export const findPostByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    })
})

// Создать пост
export const createPostSchema = z.object({
    body: z.object({
        title: z.string()
            .min(3, 'Заголовок должен содержать не менее 3 символов')
            .max(100, 'Заголовок не должен превышать 100 символов'),
        text: z.string()
            .min(3, 'Текст поста должен содержать не менее 3 символов')
            .max(2000, 'Текст поста должен содержать не более 2000 символов'),
        channelId: z.string().cuid()
    })
})

// Редактировать пост
export const updatePostSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    }),
    body: z.object({
        title: z.string()
            .min(3, 'Заголовок должен содержать не менее 3 символов')
            .max(100, 'Заголовок не должен превышать 100 символов')
            .optional(),
        text: z.string()
            .min(3, 'Текст поста должен содержать не менее 3 символов')
            .max(2000, 'Текст поста должен содержать не более 2000 символов')
            .optional(),
        banner: z.string()
            .url('')
            .regex(/.+\.(jpg|png|gif)$/i, 'Баннер должен иметь формат jpg, png или gif')
            .optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'Для редактирования поста нужно передать хотя бы одно поле'
    })
})

// Удалить пост
export const removePostSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    })
})

// Получить комменты
export const findPostCommentsSchema = z.object({
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

// Создать комментарий
export const createPostCommentSchema = z.object({
    params: z.object({
        id: z.string().cuid()
    }),
    body: z.object({
        text: z.string()
            .min(3, 'Комментарий должен содержать минимум 3 символа')
            .max(500, 'Комментарий не должен превышать 500 символов')
    })
})

// Поставить лайк
export const createPostLikeSchema = z.object({ 
    params: z.object({
        id: z.string().cuid()
    }) 
})

// Удалить лайк
export const removePostLikeSchema = z.object({ 
    params: z.object({
        id: z.string().cuid()
    }) 
})