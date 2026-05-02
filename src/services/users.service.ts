import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'

import { AppError } from '../utils/appError.util.js'
import { checkPermissions } from '../utils/checkPermissions.js'

import type { CurrentUser } from '../types/currentUser.js'
import type { IPaginationOptions } from '../types/paginationOptions.js'

// Получить пользователя по id
export const findUserById = async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) throw new AppError(404, 'User not found')

    return user
}

// Создать пользователя
export interface ICreateUser {
    name: string
    email: string
    password: string
}

export const createUser = async (data: ICreateUser) => {
    const userWithTargetEmail = await prisma.user.findUnique({ where: { email: data.email } })
    
    if (userWithTargetEmail) throw new AppError(409, 'Provided email already in use')
    
    const user = await prisma.user.create({ data })

    return user
}

// Изменить профиль пользователя
export interface IUpdateUser {
    name?: string | undefined
    email?: string | undefined
    avatar?: string | null | undefined
    telegramNotifications?: boolean | undefined
    telegramId?: string | null | undefined
}

export const updateUser = async (data: IUpdateUser, currentUser: CurrentUser) => {
    if (data.email) {
        const userWithTargetEmail = await prisma.user.findUnique({ where: { email: data.email } })
        
        if(userWithTargetEmail && userWithTargetEmail.id !== currentUser.id) {
            throw new AppError(409, 'Provided email already in use')
        }
    }
    
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    )

    const user = await prisma.user.update({
        where: { id: currentUser.id },
        data: cleanData
    })

    return user
}

// Изменить пароль пользователя
export interface IUpdateUserPassword {
    password: string
    oldPassword: string
    accessToken: string
}

export const updateUserPassword = async (data: IUpdateUserPassword, currentUser: CurrentUser) => {
    const userWithHash = await prisma.user.findUniqueOrThrow({ 
        where: { id: currentUser.id },
        select: { password: true }
    })

    const isMatch = await bcrypt.compare(data.oldPassword, userWithHash.password)

    if (!isMatch) throw new AppError(400, 'Incorrect old password')
    
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    await prisma.$transaction([
        prisma.session.deleteMany({
            where: { userId: currentUser.id }
        }),
        prisma.user.update({
            where: { id: currentUser.id },
            data: { password: hashedPassword }
        })
    ])

    const decoded = jwt.decode(data.accessToken) as { exp: number }
    const secondsUntilExpiry = (decoded?.exp || 0) - Math.floor(Date.now() / 1000)

    if (secondsUntilExpiry > 0) {
        await redis.set(`blacklist:${data.accessToken}`, '1', 'EX', secondsUntilExpiry)
    } 
}

// Удалить пользователя
export const removeUser = async (id: string, accessToken: string, currentUser: CurrentUser) => {
    checkPermissions(id, currentUser, 'Do not have permissions to delete this user')
    
    await prisma.user.delete({ where: { id } })

    if (id === currentUser.id) {
        const decoded = jwt.decode(accessToken) as { exp: number }

        const secondsUntilExpiry = (decoded?.exp || 0) - Math.floor(Date.now() / 1000)

        if (secondsUntilExpiry > 0) {
            await redis.set(`blacklist:${accessToken}`, '1', 'EX', secondsUntilExpiry)
        }
    }
}

// Получить комментарии пользователя
export const findUserComments = async (userId: string, paginationOptions: IPaginationOptions, currentUser: CurrentUser) => {
    checkPermissions(userId, currentUser, 'Do not have permissions to view comments of this user')

    const { page, limit, sortBy, order } = paginationOptions

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) throw new AppError(404, 'User not found')

    const orderBy = [ { [sortBy]: order } ]

    if (sortBy !== 'id') orderBy.push({ id: 'asc' })

    const [comments, totalItems] = await Promise.all([
        prisma.comment.findMany({
            where: { authorId: userId },
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
                likes: currentUser.id ? {
                    where: { ownerId: currentUser.id },
                    select: { ownerId: true }
                } : false
            }
        }),
        prisma.comment.count({ where: { authorId: userId } })
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

// Получить лайки пользователя
export const findUserLikes = async (userId: string, paginationOptions: IPaginationOptions) => {
    const { page, limit, sortBy, order } = paginationOptions

    const orderBy = [ { [sortBy]: order } ]

    if (sortBy !== 'id') orderBy.push({ id: 'asc' })

    const [likes, totalItems] = await Promise.all([
        prisma.like.findMany({
            where: { ownerId: userId },
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            include: {
                post: {
                    select: {
                        id: true, title: true, createdAt: true, owner: {
                            select: { id: true, name: true, avatar: true }
                        }
                    }
                },
                comment: {
                    select: {
                        id: true, text: true, createdAt: true, author: {
                            select: { id: true, name: true, avatar: true }
                        }
                    }
                }
            }
        }),
        prisma.like.count({ where: { ownerId: userId } })
    ])

    const formattedLikes = likes.map(like => {
        const type = like.post ? 'post' : 'comment'
        const content = like.post || like.comment

        return {
            id: like.id,
            type,
            createdAt: like.createdAt,
            item: content
        }
    })

    return { 
        likes: formattedLikes, 
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    }
}

// Получить подписки пользователя
export const findUserSubscriptions = async (id: string, paginationOptions: IPaginationOptions) => {
    const { page, limit, sortBy, order } = paginationOptions

    const orderBy = [ { [sortBy]: order } ]

    if (sortBy !== 'id') orderBy.push({ id: 'asc' })

    const [subscriptions, totalItems] = await Promise.all([
        prisma.subscription.findMany({
            where: { subscriberId: id },
            skip: (page - 1) * limit,
            take: limit,
            orderBy,
            include: {
                channel: {
                    select: {
                        id: true,
                        title: true,
                        avatar: true,
                        createdAt: true,
                        owner: {
                            select: { id: true, name: true, avatar: true }
                        }
                    }
                }
            }
        }),
        prisma.subscription.count({ where: { subscriberId: id } })
    ])

    const formattedSubscriptions = subscriptions.map(sub => {
        return {
            id: sub.id,
            subscriberId: sub.subscriberId,
            createdAt: sub.createdAt,
            channel: sub.channel
        }
    })

    return { 
        subscriptions: formattedSubscriptions, 
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    }
}

// Подписаться на канал
export interface ISubscribeToChannel {
    channelId: string
}

export const subscribeToChannel = async (data: ISubscribeToChannel, currentUser: CurrentUser) => {
    const channel = await prisma.channel.findUnique({
        where: { id: data.channelId }
    })

    if (!channel) throw new AppError(404, 'Channel not found')

    if (channel.ownerId === currentUser.id) {
        throw new AppError(400, 'Cannot subscribe to own channel')
    }
    
    const existingSub = await prisma.subscription.findUnique({
        where: {
            subscriberId_channelId: {
                subscriberId: currentUser.id,
                channelId: data.channelId
            }
        }
    })

    if (existingSub) throw new AppError(409, 'Subscription already exists')

    const subscription = await prisma.subscription.create({
        data: {
            subscriberId: currentUser.id,
            channelId: data.channelId
        },
        include: {
            channel: {
                select: {
                    id: true,
                    title: true,
                    avatar: true,
                    createdAt: true,
                    owner: {
                        select: { id: true, name: true, avatar: true }
                    }
                }
            }
        }
    })

    return {
        id: subscription.id,
        subscriberId: subscription.subscriberId,
        createdAt: subscription.createdAt,
        channel: subscription.channel
    }
}

// Отписаться от канала
export const removeUserSubscription = async (userId: string, channelId: string) => {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } })

    if (!channel) throw new AppError(404, 'Channel not found')
    
    const existingSub = await prisma.subscription.findFirst({
        where: {
            subscriberId: userId,
            channelId
        }
    })

    if (!existingSub) throw new AppError(404, 'Subscription does not exist')

    await prisma.subscription.delete({
        where: {
            subscriberId_channelId: {
                subscriberId: userId,
                channelId: channelId
            }
        }
    })
}