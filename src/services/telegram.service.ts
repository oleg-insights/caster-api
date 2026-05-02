import axios from 'axios'

import { prisma } from '../lib/prisma.js'

import { AppError } from '../utils/appError.util.js'

type ActionType = 'subscription' | 'comment' | 'like'
type TargetType = 'channel' | 'post' | 'comment'

export interface INotificationData {
    recipientId: string
    initiatorName: string
    action: {
        type: ActionType
    }
    target: {
        type: TargetType
        name?: string
        url?: string 
    }
}

const labels: Partial<Record<ActionType, Partial<Record<TargetType, string>>>> = {
    subscription: {
        channel: 'подписался на ваш канал'
    },
    comment: {
        post: 'прокомментировал ваш пост'
    },
    like: {
        post: 'поставил лайк под вашим постом',
        comment: 'поставил лайк под вашим комментарием'
    }
}

const telegramToken = process.env.TELEGRAM_TOKEN

export const sendNotification = async (data: INotificationData) => {
    const recipient = await prisma.user.findUnique({ where: { id: data.recipientId } })

    if (!recipient) throw new AppError(404, 'Recipient not found')

    if (!recipient.telegramNotifications) {
        console.error('Recipient notifications disabled')
        return
    }

    if (!recipient.telegramId) {
        console.error('User telegram id is missing')
        return
    } 

    const label = `${labels[data.action.type]?.[data.target.type]}`

    if (!label) {
        console.warn(`[Telegram Service]: not found label for action:${data.action.type}/target:${data.target.type}`)
        return
    }

    const method = 'sendMessage'
    const url = `https://api.telegram.org/bot${telegramToken}/${method}`
    const message = `${data.initiatorName} ${label}${data.target.name ? ` "${data.target.name}"` : ''}`

    try {
        await axios.post(url, {
            chat_id: recipient.telegramId,
            text: message
        })
    } catch (error: any) {
        console.error(`[Telegram Service]: ${error.response?.data?.description} || ${error.message}`)
    }
}