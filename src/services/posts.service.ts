import { prisma } from '../lib/prisma.js'

import { AppError } from '../utils/appError.util.js'
import { checkPermissions } from '../utils/checkPermissions.js'

import type { CurrentUser } from '../types/currentUser.js'
import type { IPaginationOptions } from '../types/paginationOptions.js'

// Получить все посты
export const findAllPosts = async (paginationOptions: IPaginationOptions, currentUser?: CurrentUser) => {
    const { page, limit, sortBy, order } = paginationOptions

    const [posts, totalItems] = await Promise.all([
        prisma.post.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: order },
            include: {
                owner: { 
                    select: { id: true, name: true, avatar: true } 
                },
                _count: { 
                    select: { likes: true }
                },
                likes: currentUser?.id ? {
                    where: { ownerId: currentUser.id },
                    select: { ownerId: true }
                } : false
            }
        }),
        prisma.post.count()
    ])

    const formattedPosts = posts.map(post => ({
        ...post,
        isLikedByMe: !!(post.likes && post.likes.length > 0),
        likes: undefined,
        ownerId: undefined
    }))
    
    return { 
        posts: formattedPosts,
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    }
}

// Получить пост по id
export const findPostById = async (id: string, currentUser?: CurrentUser) => {
    const post = await prisma.post.findUnique({ 
        where: { id },
        include: {
            owner: { 
                select: { id: true, name: true, avatar: true } 
            },
            _count: {
                select: { likes: true }
            },
            likes: currentUser?.id ? {
                where: { ownerId: currentUser.id },
                select: { ownerId: true }
            } : false
        }
    })

    if (!post) throw new AppError(404, 'Post not found')

    return { 
        ...post,
        isLikedByMe: !!(post.likes && post.likes.length > 0),
        likes: undefined,
        ownerId: undefined
    }
}

// Создать пост
export interface ICreatePost {
    title: string
    text: string
    channelId: string
}

export const createPost = async (data: ICreatePost, currentUser: CurrentUser) => {
    const channel = await prisma.channel.findUnique({
        where: { id: data.channelId }
    })

    if (!channel) throw new AppError(404, 'Channel not found')

    if (currentUser.id !== channel.ownerId) throw new AppError(403, 'Do not have permissions to create post in this channel')
    
    const post = await prisma.post.create({
        data: { 
            title: data.title,
            text: data.text,
            channel: { connect: { id: data.channelId } },
            owner: { connect: { id: channel.ownerId } }
        },
        include: {
            owner: { 
                select: { id: true, name: true, avatar: true } 
            },
            _count: {
                select: { likes: true }
            }
        }
    })

    return { 
        ...post, 
        isLikedByMe: false,
        ownerId: undefined
    }
}

// Редактировать пост
export interface IUpdatePost {
    title?: string | undefined
    text?: string | undefined
    banner?: string | undefined
}

export const updatePost = async (id: string, data: IUpdatePost, currentUser: CurrentUser) => {
    const post = await prisma.post.findUnique({ where: { id } })

    if (!post) throw new AppError(404, 'Post not found')

    checkPermissions(post.ownerId, currentUser, 'Do not have permissions to edit this post')

    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    )

    const updatedPost = await prisma.post.update({
        where: { id },
        data: cleanData,
        include: {
            owner: { 
                select: { id: true, name: true, avatar: true } 
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
        ...updatedPost, 
        isLikedByMe: !!(updatedPost.likes && updatedPost.likes.length > 0),
        likes: undefined,
        ownerId: undefined
    }
}

// Удалить пост
export const removePost = async (id: string, currentUser: CurrentUser) => {
    const post = await prisma.post.findUnique({ where: { id } })

    if (!post) throw new AppError(404, 'Post not found')
    
    checkPermissions(post.ownerId, currentUser, 'Do not have permissions to delete this post')
    
    await prisma.post.delete({ where: { id } })
}

// Получить комментарии
export const findPostComments = async (postId: string, paginationOptions: IPaginationOptions, currentUser?: CurrentUser) => {
    const { page, limit, sortBy, order } = paginationOptions

    const post = await prisma.post.findUnique({ where: { id: postId } })

    if (!post) throw new AppError(404, 'Post not found')

    const orderBy = [ { [sortBy]: order } ]

    if (sortBy !== 'id') orderBy.push({ id: 'asc' })
    
    const [comments, totalItems] = await Promise.all([
        prisma.comment.findMany({
            where: { postId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
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
                likes: currentUser?.id ? {
                    where: { ownerId: currentUser.id },
                    select: { ownerId: true }
                } : false
            }
        }),
        prisma.comment.count({ where: { postId } })
    ])

    const formattedComments = comments.map(comment => ({
        ...comment,
        isLikedByMe: !!(comment.likes && comment.likes.length > 0),
        likes: undefined,
        authorId: undefined
    }))

    return { 
        comments: formattedComments, 
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    }
}

// Создать комментарий
export interface ICreatePostComment {
    text: string
}

export const createPostComment = async (postId: string, data: ICreatePostComment, currentUser: CurrentUser) => {
    const comment = await prisma.comment.create({
        data: { 
            text: data.text,
            post: { connect: { id: postId } },
            author: { connect: { id: currentUser.id } }
        },
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
            }
        }
    })

    return { 
        ...comment, 
        isLikedByMe: false,
        authorId: undefined
    }
}

// Поставить лайк
export const createPostLike = async (postId: string, currentUser: CurrentUser) => {
    const post = await prisma.post.findUnique({ where: { id: postId } })
    
    if (!post) throw new AppError(404, 'Post not found')

    const existingLike = await prisma.like.findUnique({
        where: {
            ownerId_postId: { ownerId: currentUser.id, postId }
        }
    })
    
    if (existingLike) throw new AppError(409, 'Post already liked')

    const like = await prisma.like.create({
        data: {
            post: { connect: { id: postId } },
            owner: { connect: { id: currentUser.id } }
        }
    })

    return like
}

// Удалить лайк
export const removePostLike = async (postId: string, currentUser: CurrentUser) => {
    const post = await prisma.post.findUnique({ where: { id: postId } })

    if (!post) throw new AppError(404, 'Post not found')
    
    const existingLike = await prisma.like.findUnique({
        where: {
            ownerId_postId: { ownerId: currentUser.id, postId }
        }
    })
    
    if (!existingLike) throw new AppError(404, 'Like not found')

    await prisma.like.delete({ where: { id: existingLike.id } })
}