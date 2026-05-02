import { prisma } from '../lib/prisma.js'

import { AppError } from '../utils/appError.util.js'
import { checkPermissions } from '../utils/checkPermissions.js'

import type { CurrentUser } from '../types/currentUser.js'

// Редактировать комментарий
export interface IUpdateComment {
    text?: string | undefined
}

export const updateComment = async (id: string, data: IUpdateComment, currentUser: CurrentUser) => {
    const comment = await prisma.comment.findUnique({ where: { id } })

    if (!comment) throw new AppError(404, 'Comment not found')

    if (currentUser.id !== comment.authorId) throw new AppError(403, 'Do not have permissions to edit this comment')

    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    )
    
    const updatedComment = await prisma.comment.update({
        where: { id },
        data: cleanData,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true
                }
            },
            _count: {
                select: { likes: true }
            },
            likes: currentUser.id ? {
                where: { ownerId: currentUser.id },
                select: { ownerId: true }
            } : false
        }
    })

    return { 
        ...updatedComment, 
        isLikedByMe: !!(updatedComment.likes && updatedComment.likes.length > 0),
        likes: undefined,
        authorId: undefined
    }
}

// Удалить комментарий
export const removeComment = async (id: string, currentUser: CurrentUser) => {
    const comment = await prisma.comment.findUnique({ where: { id } })

    if (!comment) throw new AppError(404, 'Comment not found')

    checkPermissions(comment.authorId, currentUser, 'Do not have permissions to delete this comment')
    
    await prisma.comment.delete({ where: { id } })
}

// Поставить лайк
export const createCommentLike = async (commentId: string, currentUser: CurrentUser) => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    
    if (!comment) throw new AppError(404, 'Comment not found')

    const existingLike = await prisma.like.findUnique({
        where: {
            ownerId_commentId: { ownerId: currentUser.id, commentId }
        }
    })
    
    if (existingLike) throw new AppError(409, 'Comment already liked')

    const like = await prisma.like.create({
        data: {
            comment: { connect: { id: commentId } },
            owner: { connect: { id: currentUser.id } }
        }
    })

    return like
}

// Удалить лайк
export const removeCommentLike = async (commentId: string, currentUser: CurrentUser) => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } })

    if (!comment) throw new AppError(404, 'Comment not found')
    
    const existingLike = await prisma.like.findUnique({
        where: {
            ownerId_commentId: { ownerId: currentUser.id, commentId }
        }
    })
    
    if (!existingLike) throw new AppError(404, 'Like not found')

    await prisma.like.delete({ where: { id: existingLike.id } })
}