import { prisma } from '../lib/prisma.js'

import { checkPermissions } from '../utils/checkPermissions.js'
import { AppError } from '../utils/appError.util.js'

import type { CurrentUser } from '../types/currentUser.js'
import type { IPaginationOptions } from '../types/paginationOptions.js'

// Получить все каналы
export const findAllChannels = async (paginationOptions: IPaginationOptions) => {
    const { page, limit, sortBy, order } = paginationOptions

    const orderBy = [ { [sortBy]: order } ]

    if (sortBy !== 'id') orderBy.push({ id: 'asc' })

    const [channels, totalItems] = await Promise.all([
        prisma.channel.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy
        }),
        prisma.channel.count()
    ])
    
    return { 
        channels, 
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    }
}

// Получить канал по id
export const findChannelById = async (id: string) => {
    const channel = await prisma.channel.findUnique({
        where: { id }
    })

    if (!channel) throw new AppError(404, 'Channel not found')

    return channel
}

// Создать канал
export interface ICreateChannel {
    title: string
}

export const createChannel = async (data: ICreateChannel, currentUser: CurrentUser) => {
    const existingChannel = await prisma.channel.findUnique({ where: { title: data.title } })

    if (existingChannel) throw new AppError(409, 'Title already in use')
    
    const channel = await prisma.channel.create({ 
        data: { 
            title: data.title, 
            ownerId: currentUser.id 
        } 
    })

    return channel
}

// Отредактировать канал
export interface IUpdateChannel {
  title?: string | undefined,
  description?: string | null | undefined,
  avatar?: string | null | undefined,
  banner?: string | null | undefined
}

export const updateChannel = async (id: string, data: IUpdateChannel, currentUser: CurrentUser) => {
    const channel = await prisma.channel.findUnique({ where: { id } })

    if (!channel) throw new AppError(404, 'Channel not found')

    if (data.title) {
        const existingChannelWithTitle = await prisma.channel.findUnique({ where: { title: data.title } })

        if (existingChannelWithTitle && existingChannelWithTitle.id !== id) {
            throw new AppError(409, 'Title already in use')
        }
    }

    checkPermissions(channel.ownerId, currentUser, 'Do not have permissions to edit this channel')

    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    )
    
    const updatedChannel = await prisma.channel.update({
        where: { id }, 
        data: cleanData
    })

    return updatedChannel
}

// Удалить канал
export const removeChannel = async (id: string, currentUser: CurrentUser) => {
    const channel = await prisma.channel.findUnique({ where: { id } })

    if (!channel) throw new AppError(404, 'Channel not found')

    checkPermissions(channel.ownerId, currentUser, 'Do not have permissions to delete this channel')
    
    await prisma.channel.delete({ where: { id } })
}

// Получить подписчиков
export const findSubscribers = async (id: string, paginationOptions: IPaginationOptions) => {
    const channel = await prisma.channel.findUnique({ where: { id }})

    if (!channel) throw new AppError(404, 'Channel not found')
    
    const { page, limit, sortBy, order } = paginationOptions

    const orderByObject = sortBy == 'name'
        ? { subscriber: { name: order } }
        : { [sortBy]: order }

    const [subscriptions, totalItems] = await Promise.all([
        prisma.subscription.findMany({
            where: { channelId: id },
            select: {
                subscriber: true
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: orderByObject
        }),
        prisma.subscription.count({ where: { channelId: id } })
    ])

    const subscribers = subscriptions.map(sub => sub.subscriber)

    return { 
        subscribers, 
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    }
}