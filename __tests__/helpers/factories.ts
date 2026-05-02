import bcrypt from 'bcrypt'

import { prisma } from '../../src/lib/prisma.js'

import { randomString } from './randomString.js'

export const createUser = async ({
    role = 'USER', 
    email = `box_${randomString(5)}@test.com`,
    name = `user_${randomString(5)}`,
    password = `password_${randomString(5)}.`
} = {}) => {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    return await prisma.user.create({
        data: { role, email, name, password: hashedPassword }
    })
}

export const createChannel = async (userId: string, {
    title = `channel_${randomString(5)}`,
    description = undefined as string | undefined
} = {}) => {
    return await prisma.channel.create({
        data: { title, description, ownerId: userId }
    })
}

export const createSubscription = async (subscriberId: string, channelId: string) => {
    return await prisma.subscription.create({
        data: { subscriberId, channelId }
    })
}

export const createPost = async (ownerId: string, channelId: string, {
    title = `title_${randomString(10)}`,
    text = `text_${randomString(30)}`
} = {}) => {
    return await prisma.post.create({
        data: { ownerId, channelId, title, text }
    })
}

export const createComment = async (authorId: string, postId: string, {
    text = `text_ ${randomString(20)}`
} = {}) => {
    return await prisma.comment.create({
        data: { authorId, postId, text }
    })
}

export const createPostLike = async (ownerId: string, postId: string) => {
    return await prisma.like.create({
        data: { ownerId, postId }
    })
}

export const createCommentLike = async (ownerId: string, commentId: string) => {
    return await prisma.like.create({
        data: { ownerId, commentId }
    })
}

export const createSession = async (userId: string, tokens: { accessToken: string, refreshToken: string, expiresAt: Date }) => {
    return prisma.session.create({
        data: {
            userId,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
            userAgent: null,
            ip: null
        }
    })
}