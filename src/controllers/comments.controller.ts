import * as CommentsService from '../services/comments.service.js'
import {
    updateCommentSchema,
    removeCommentSchema,
    createCommentLikeSchema,
    removeCommentLikeSchema
} from '../schemas/comment.schema.js'

import type { Request, Response } from 'express'

// Редактировать комментарий
export const update = async (req: Request, res: Response) => {
    const validated = updateCommentSchema.parse(req)
    const id = validated.params.id

    const dataForService: CommentsService.IUpdateComment = validated.body

    const comment = await CommentsService.updateComment(id, dataForService, req.user!)
        
    res.json({ success: true, data: { comment } })
}

// Удалить комментарий
export const remove = async (req: Request, res: Response) => {
    const validated = removeCommentSchema.parse(req)
    const id = validated.params.id

    await CommentsService.removeComment(id, req.user!)
        
    res.status(204).end()
}

// Поставить лайк
export const createLike = async (req: Request, res: Response) => {
    const validated = createCommentLikeSchema.parse(req)
    const id = validated.params.id

    const like = await CommentsService.createCommentLike(id, req.user!)

    res.status(201).json({ success: true, data: { like } })
}

// Удалить лайк
export const removeLike = async (req: Request, res: Response) => {
    const validated = removeCommentLikeSchema.parse(req)
    const id = validated.params.id

    await CommentsService.removeCommentLike(id, req.user!)

    res.status(204).end()
}