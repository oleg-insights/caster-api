import * as ChannelsService from '../services/channels.service.js'
import { 
    findAllChannelsSchema,
    findChannelByIdSchema,
    createChannelSchema,
    updateChannelSchema,
    removeChannelSchema,
    findSubscribersSchema
} from '../schemas/channel.schema.js'

import { toUserPublicDto } from '../mappers/user.mapper.js'

import type { Request, Response } from 'express'
import type { IPaginationOptions } from '../types/paginationOptions.js'
import type { User } from '@prisma/client'

// Получить все каналы
export const getAll = async (req: Request, res: Response) => {
    const validated = findAllChannelsSchema.parse(req)
    const paginationOptions: IPaginationOptions = validated.query

    const result = await ChannelsService.findAllChannels(paginationOptions)
    const { channels, meta } = result
        
    res.json({ success: true, data: { channels, meta } })
}

// Получить канал по id
export const getOneById = async (req: Request, res: Response) => {
    const validated = findChannelByIdSchema.parse(req)
    const id = validated.params.id
    
    const channel = await ChannelsService.findChannelById(id)
        
    res.json({ success: true, data: { channel } })
}

// Создать канал
export const create = async (req: Request, res: Response) => {
    const validated = createChannelSchema.parse(req)
    
    const currentUser = req.user!

    const dataForService: ChannelsService.ICreateChannel = validated.body

    const channel = await ChannelsService.createChannel(dataForService, currentUser)
        
    res.status(201).json({ success: true, data: { channel } })
}

// Отредактировать канал
export const update = async (req: Request, res: Response) => {
    const validated = updateChannelSchema.parse(req)
    const id = validated.params.id

    const currentUser = req.user!

    const dataForService: ChannelsService.IUpdateChannel = validated.body
    
    const channel = await ChannelsService.updateChannel(id, dataForService, currentUser)
        
    res.json({ success: true, data: { channel } })
}

// Удалить канал
export const remove = async (req: Request, res: Response) => {
    const validated = removeChannelSchema.parse(req)
    const id = validated.params.id

    const currentUser = req.user!

    await ChannelsService.removeChannel(id, currentUser)
    
    res.status(204).end()
}

// Получить подписчиков
export const getSubscribers = async (req: Request, res: Response) => {
    const validated = findSubscribersSchema.parse(req)
    const id = validated.params.id
    const paginationOptions: IPaginationOptions = validated.query

    const result = await ChannelsService.findSubscribers(id, paginationOptions)
    const { subscribers, meta } = result

    res.json({ success: true, data: { 
        subscribers: subscribers.map((sub: User) => toUserPublicDto(sub)), 
        meta 
    } })
}