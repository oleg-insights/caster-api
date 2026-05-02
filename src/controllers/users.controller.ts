import * as UsersService from '../services/users.service.js'
import { 
    findUserByIdSchema, 
    updateUserSchema,
    updateUserPasswordSchema,
    removeUserSchema,
    findUserCommentsSchema,
    findCurrentUserLikesSchema,
    findCurrentUserSubscriptionsSchema,
    subscribeToChannelSchema,
    removeUserSubscriptionSchema
} from '../schemas/user.schema.js'

import { toUserPrivateDto, toUserPublicDto } from '../mappers/user.mapper.js'
import { AppError } from '../utils/appError.util.js'

import type { Request, Response } from 'express'
import type { IPaginationOptions } from '../types/paginationOptions.js'

// Получить свой профиль
export const getMe = async (req: Request, res: Response) => {
    const user = await UsersService.findUserById(req.user!.id)
        
    res.json({ success: true, data: { 
        user: toUserPrivateDto(user) 
    } })
}

// Получить пользователя по id
export const getByid = async (req: Request, res: Response) => {
    const validated = findUserByIdSchema.parse(req)
    const id = validated.params.id
    
    const user = await UsersService.findUserById(id)
        
    res.json({ success: true, data: { 
        user: toUserPublicDto(user)  
    } })
}

// Редактировать данные пользователя
export const update = async (req: Request, res: Response) => {
    const validated = updateUserSchema.parse(req)
    const dataForService: UsersService.IUpdateUser = validated.body

    const user = await UsersService.updateUser(dataForService, req.user!)
        
    res.json({ success: true, data: { 
        user: toUserPrivateDto(user)
    } })
}

// Изменить пароль пользователя
export const updatePassword = async (req: Request, res: Response) => {
    const validated = updateUserPasswordSchema.parse(req)
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(401, 'Access token is missing')
    }

    const accessToken = authHeader.split(' ')[1] as string

    const dataForService: UsersService.IUpdateUserPassword = {
        ...validated.body,
        accessToken
    }

    await UsersService.updateUserPassword(dataForService, req.user!)

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    })

    res.status(204).end()
}

// Удалить пользователя
export const remove = async (req: Request, res: Response) => {
    const validated = removeUserSchema.parse(req)
    const id = validated.params.id

    const authHeader = req.headers.authorization
    const accessToken = authHeader!.split(' ')[1] as string

    await UsersService.removeUser(id, accessToken, req.user!)

    if (id === req.user!.id) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })
    }

    res.status(204).end()
}

// Получить комментарии пользователя
export const getComments = async (req: Request, res: Response) => {
    const validated = findUserCommentsSchema.parse(req)
    const userId = validated.params.id
    const paginationOptions: IPaginationOptions = validated.query

    const result = await UsersService.findUserComments(userId, paginationOptions, req.user!)
    const { comments, meta } = result

    res.json({ success: true, data: { comments, meta } })
}

// Получить лайки пользователя
export const getLikes = async (req: Request, res: Response) => {
    const validated = findCurrentUserLikesSchema.parse(req)
    const paginationOptions: IPaginationOptions = validated.query
    
    const result = await UsersService.findUserLikes(req.user!.id, paginationOptions)
    const { likes, meta } = result

    res.json({ success: true, data: { likes, meta } })
}

// Получить подписки пользователя
export const getSubscriptions = async (req: Request, res: Response) => {
    const validated = findCurrentUserSubscriptionsSchema.parse(req)
    const paginationOptions: IPaginationOptions = validated.query
    
    const result = await UsersService.findUserSubscriptions(req.user!.id, paginationOptions)
    const { subscriptions, meta } = result

    res.json({ success: true, data: { subscriptions, meta } })
}

// Подписаться на канал
export const subscribeToChannel = async (req: Request, res: Response) => {
    const validated = subscribeToChannelSchema.parse(req)

    const dataForService: UsersService.ISubscribeToChannel = validated.body

    const subscription = await UsersService.subscribeToChannel(dataForService, req.user!)

    res.status(201).json({ success: true, data: { subscription } })
}

// Отменить подписку
export const removeSubscribe = async (req: Request, res: Response) => {
    const validate = removeUserSubscriptionSchema.parse(req)
    const channelId = validate.params.channelId

    await UsersService.removeUserSubscription(req.user!.id, channelId)

    res.status(204).end()
}