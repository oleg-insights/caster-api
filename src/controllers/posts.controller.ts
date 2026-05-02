import * as PostsService from '../services/posts.service.js'
import { 
    findAllPostsSchema,
    findPostByIdSchema,
    createPostSchema,
    updatePostSchema,
    removePostSchema,
    findPostCommentsSchema,
    createPostCommentSchema,
    createPostLikeSchema,
    removePostLikeSchema
} from '../schemas/post.schema.js'

import type { Request, Response } from 'express'
import type { IPaginationOptions } from '../types/paginationOptions.js'

// Получить все посты
export const getAll = async (req: Request, res: Response) => {
    const validated = findAllPostsSchema.parse(req)
    const paginationOptions: IPaginationOptions = validated.query

    const result = await PostsService.findAllPosts(paginationOptions, req.user)
    const { posts, meta } = result
        
    res.json({ success: true, data: { posts, meta } })
}

// Получить пост по id
export const getById = async (req: Request, res: Response) => {
    const validated = findPostByIdSchema.parse(req)
    const id = validated.params.id

    const post = await PostsService.findPostById(id, req.user)
        
    res.json({ success: true, data: { post } })
}

// Создать пост
export const create = async (req: Request, res: Response) => {
    const validated = createPostSchema.parse(req)
    const dataForService: PostsService.ICreatePost = validated.body

    const post = await PostsService.createPost(dataForService, req.user!)
        
    res.status(201).json({ success: true, data: { post } })
}

// Редактировать пост
export const update = async (req: Request, res: Response) => {
    const validated  = updatePostSchema.parse(req)
    const id = validated.params.id

    const dataForService: PostsService.IUpdatePost = validated.body
    
    const post = await PostsService.updatePost(id, dataForService, req.user!)
        
    res.json({ success: true, data: { post } })
}

// Удалить пост
export const remove = async (req: Request, res: Response) => {
    const validated = removePostSchema.parse(req)
    const id = validated.params.id

    await PostsService.removePost(id, req.user!)
        
    res.status(204).end()
}

// Получить комментарии
export const getComments = async (req: Request, res: Response) => {
    const validated = findPostCommentsSchema.parse(req)
    const postId = validated.params.id
    const paginationOptions: IPaginationOptions = validated.query

    const result = await PostsService.findPostComments(postId, paginationOptions, req.user)
    const { comments, meta } = result

    res.json({ success: true, data: { comments, meta } })
}

// Создать комментарий
export const createComment = async (req: Request, res: Response) => {
    const validated = createPostCommentSchema.parse(req)
    const postId = validated.params.id
    const dataForService: PostsService.ICreatePostComment = validated.body

    const comment = await PostsService.createPostComment(postId, dataForService, req.user!)
        
    res.status(201).json({ success: true, data: { comment } })
}

// Поставить лайк
export const createLike = async (req: Request, res: Response) => {
    const validated = createPostLikeSchema.parse(req)
    const id = validated.params.id

    const like = await PostsService.createPostLike(id, req.user!)

    res.status(201).json({ success: true, data: { like } })
}

// Удалить лайк
export const removeLike = async (req: Request, res: Response) => {
    const validated = removePostLikeSchema.parse(req)
    const id = validated.params.id

    await PostsService.removePostLike(id, req.user!)

    res.status(204).end()
}