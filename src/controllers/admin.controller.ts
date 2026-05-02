import * as AdminService from '../services/admin.service.js'
import { findUsersSchema, changeUserRoleSchema } from '../schemas/admin.schema.js'

import { toUserPrivateDto } from '../mappers/user.mapper.js'
import { AppError } from '../utils/appError.util.js'

import type { Request, Response } from 'express'
import type { IPaginationOptions } from '../types/paginationOptions.js'
import type { User } from '@prisma/client'

// Получить список пользователей
export const getUsers = async (req: Request, res: Response) => {
    const validated = findUsersSchema.parse(req)
    const paginationOptions: IPaginationOptions = validated.query
    
    const result = await AdminService.findUsers(paginationOptions)
    const { users, meta } = result
        
    res.json({ success: true, data: { 
        users: users.map((user: User) => toUserPrivateDto(user)), 
        meta 
    } })
}

// Изменить роль пользователя
export const changeRole = async (req: Request, res: Response) => {
    const validated = changeUserRoleSchema.parse(req)
    const id = validated.params.id

    if (id === req.user?.userId) throw new AppError(403, 'Cannot change own role')

    const dataForService: AdminService.IChangeUserRole = validated.body

    const user = await AdminService.changeUserRole(id, dataForService)

    res.json({ success: true, data: {
        user: toUserPrivateDto(user)
    } })
}