import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

import { AppError } from '../utils/appError.util.js'

import type { IPaginationOptions } from '../types/paginationOptions.js'

// Получить список пользователей
export const findUsers = async (paginationOptions: IPaginationOptions) => {
    const { page, limit, sortBy, order } = paginationOptions

    const orderBy = [ { [sortBy]: order } ]

    if (sortBy !== 'id') orderBy.push({ id: 'asc' })
    
    const [users, totalItems] = await Promise.all([
        prisma.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy
        }),
        prisma.user.count()
    ])

    return { 
        users, 
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    }
}

// Изменить роль пользователя
export interface IChangeUserRole {
    role: string
}

export const changeUserRole = async (id: string, data: IChangeUserRole) => {
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { role: data.role }
        })

        return user
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new AppError(404, 'User not found')
            }
        }
        throw error
    }
}