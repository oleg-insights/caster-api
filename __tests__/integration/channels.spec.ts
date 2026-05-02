import request from 'supertest'
import { describe, it, expect, beforeEach, beforeAll } from 'vitest'

import { app } from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'

import { generateTokens } from '../../src/utils/jwt.util.js'

import { createChannel, createUser, createSubscription } from '../helpers/factories.js'
import { expectInvalidPagination, expectInvalidCuid } from '../helpers/validation.helper.js'
import { randomString } from '../helpers/randomString.js'
import { expectUnauthorized } from '../helpers/auth.helper.js'

import type { IMeta } from '../../src/types/meta.js'
import type { Channel, User } from '@prisma/client'

describe('GET /api/channels', () => {
    
    beforeEach(async () => {
        await prisma.channel.deleteMany()
        await prisma.user.deleteMany()
    })
    
    it('should return 200 and list of channels based on pagination', async () => {
        const user = await createUser()
        
        const testChannels = await Promise.all(
            Array.from({length: 5}).map(() => createChannel(user.id))
        )

        expect(testChannels[0]).toBeTruthy()

        const idsToUpdate = [
            testChannels[0].id, 
            testChannels[2].id, 
            testChannels[4].id
        ]

        for (const id of idsToUpdate) {
            await prisma.channel.update({
                where: { id },
                data: { title: `a_${randomString(5)}` }
            })
        }
        
        const response = await request(app)
            .get('/api/channels')
            .query({ page: 2, limit: 2, sortBy: 'title', order: 'desc' })

        expect(response.status).toBe(200)

        const channels: Channel[] = response.body.data?.channels

        expect(Array.isArray(channels)).toBe(true)
        expect(channels).toHaveLength(2)
        channels.forEach(channel => {
            expect(channel.title.substring(0, 2)).toBe('a_')
        })

        const meta: IMeta = response.body.data?.meta

        expect(meta.totalItems).toBe(5)
        expect(meta.totalPages).toBe(3)
        expect(meta.currentPage).toBe(2)
        expect(meta.limit).toBe(2)
    })

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/channels', () => null)

})

describe('GET /api/channels/:id', () => {

    let user: User
    let channel: Channel
    
    beforeAll(async () => {
        await prisma.user.deleteMany()
        user = await createUser()
    })
    
    beforeEach(async () => {
        await prisma.channel.deleteMany()
        channel = await createChannel(user.id)
    })
    
    it('should return 200 and channel data', async () => {
        const response = await request(app)
            .get(`/api/channels/${channel.id}`)

        expect(response.status).toBe(200)
        
        const channelInResponse = response.body.data?.channel

        expect(channelInResponse).toMatchObject({
            id: channel.id,
            title: channel.title,
            ownerId: channel.ownerId
        })
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('get', '/api/channels/:id', () => null)

    it('should return 404 if channel not found', async () => {
        const fakeChannelId = channel.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .get(`/api/channels/${fakeChannelId}`)

        expect(response.status).toBe(404)
    })

})

describe('POST /api/channels', () => {

    let user: User
    let userToken: string

    beforeAll(async () => {
        user = await createUser()
        userToken = generateTokens(user.id, user.role).accessToken
    })

    beforeEach(async () => {
        await prisma.channel.deleteMany()
    })
    
    it('should return 201 and create channel', async () => {
        const response = await request(app)
            .post('/api/channels')
            .send({title: 'created_channel'})
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(201)

        const channel: Channel = response.body.data?.channel

        expect(channel).toMatchObject({ ownerId: user.id, title: 'created_channel' })
    })

    it('should return 400 if title is invalid', async () => {
        const invalidTitles = [25, 'a', 'a'.repeat(100)]

        for (const title of invalidTitles) {
            const response = await request(app)
                .post('/api/channels')
                .send({ title })
                .set('Authorization', `Bearer ${userToken}`)

            expect(response.status).toBe(400)
        }
    })

    // should return 401 if not authenticated
    expectUnauthorized('post', '/api/channels')

    it('should return 409 if title already in use', async () => {
        await createChannel(user.id, {title: 'channel_1'})

        const response = await request(app)
            .post('/api/channels')
            .send({ title: 'channel_1' })
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(409)

        const channelsInDb = await prisma.channel.findMany({
            where: { title: 'channel_1' }
        })

        expect(channelsInDb).toHaveLength(1)
    })

})

describe('PATCH /api/channels/:id', () => {

    const validPatchData = {
        title: 'new_title',
        description: 'new_description',
        avatar: 'https://new_avatar.png',
        banner: 'https://new_banner.png'
    }

    const invalidItems = [
        { payload: { title: 25 }, reason: 'title is not a string' },
        { payload: { description: 'd' }, reason: 'description is too short' },
        { payload: { avatar: 'avatar' }, reason: 'avatar is not a link' },
        { payload: { banner: 'https://banner.exe' }, reason: 'banner format is invalid' }
    ]
    
    let user: User
    let userToken: string
    let channel: Channel
    
    beforeAll(async () => {
        user = await createUser()
        userToken = generateTokens(user.id, user.role).accessToken
    })

    beforeEach(async () => {
        await prisma.channel.deleteMany()
        
        channel = await createChannel(user.id, {
            title: 'original_title',
            description: 'original_description'
        })
    })
    
    it('should return 200 and change provided fields', async () => {
        const response = await request(app)
            .patch(`/api/channels/${channel.id}`)
            .send({ title: 'updated_title' })
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(200)

        const channelInDb = await prisma.channel.findUnique({ where: { id: channel.id } })

        expect(channelInDb).toMatchObject({
            title: 'updated_title',
            description: 'original_description'
        })
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('patch', '/api/channels/:id', () => userToken)

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .patch(`/api/channels/${channel.id}`)
                .send({ ...validPatchData, ...item.payload })
                .set('Authorization', `Bearer ${userToken}`)
            
            expect(response.status).toBe(400)
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('patch', '/api/channels/:id')

    it('should return 403 if authenticated but not an admin or owner', async () => {
        const anotherUser = await createUser({ role: 'USER' })
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .patch(`/api/channels/${channel.id}`)
            .send({ ...validPatchData })
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)

        const channelInDb = await prisma.channel.findUnique({ where: { id: channel.id } })

        expect(channelInDb).toMatchObject({
            title: 'original_title',
            description: 'original_description'
        })
    })

    it('should return 404 if channel not found', async () => {
        await prisma.channel.deleteMany()

        const response = await request(app)
            .patch(`/api/channels/${channel.id}`)
            .send({ ...validPatchData })
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(404)
    })

    it('should return 409 if title already in use', async () => {
        await createChannel(user.id, { title: 'new_channel' })
        
        const response = await request(app)
            .patch(`/api/channels/${channel.id}`)
            .send({ title: 'new_channel' })
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(409)
    })

})

describe('DELETE /api/channels/:id', () => {

    let user: User
    let userToken: string
    let channel: Channel
    
    beforeAll(async () => {
        user = await createUser()
        userToken = generateTokens(user.id, user.role).accessToken
    })

    beforeEach(async () => {
        await prisma.channel.deleteMany()
        channel = await createChannel(user.id)
    })
    
    it('should return 204 and remove channel from db', async () => {
        const response = await request(app)
            .delete(`/api/channels/${channel.id}`)
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(204)

        const channelInDb = await prisma.channel.findUnique({ where: { id: channel.id } })

        expect(channelInDb).toBeNull()
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('delete', '/api/channels/:id', () => userToken)

    // should return 401 if not authenticated
    expectUnauthorized('delete', '/api/channels/:id')

    it('should return 403 if authenticated but not an admin or owner', async () => {
        const anotherUser = await createUser({ role: 'USER' })
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .delete(`/api/channels/${channel.id}`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)

        const channelInDb = await prisma.channel.findUnique({ where: { id: channel.id } })

        expect(channelInDb).toBeDefined()
    })

    it('should return 404 if channel not found', async () => {
        await prisma.channel.deleteMany()

        const response = await request(app)
            .delete(`/api/channels/${channel.id}`)
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(404)
    })

})

describe('GET /api/channels/:id/subscribers', () => {

    let owner: User
    let ownerToken: string
    let channel: Channel
    
    beforeAll(async () => {
        await prisma.user.deleteMany()
        
        owner = await createUser()
        ownerToken = generateTokens(owner.id, owner.role).accessToken
        channel = await createChannel(owner.id)
    })
    
    it('should return 200 and list of channel subscribers based on pagination', async () => {
        const usersToSubscribe = await Promise.all(
            Array.from({length: 5}).map(() => createUser())
        )

        for (const user of usersToSubscribe) {
            await createSubscription(user.id, channel.id)
        }

        const response = await request(app)
            .get(`/api/channels/${channel.id}/subscribers`)
            .query({page: 2, limit: 2, sortBy: 'name', order: 'desc'})
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(200)
        
        const subscribers: User[] = response.body.data?.subscribers

        expect(Array.isArray(subscribers)).toBe(true)
        expect(subscribers).toHaveLength(2)
        
        const sub_1 = subscribers[0].name.toLowerCase()
        const sub_2 = subscribers[1].name.toLowerCase()

        expect(sub_1 >= sub_2).toBe(true)

        const meta: IMeta = response.body.data?.meta

        expect(meta.totalItems).toBe(5)
        expect(meta.totalPages).toBe(3)
        expect(meta.currentPage).toBe(2)
        expect(meta.limit).toBe(2)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('get', '/api/channels/:id/subscribers', () => ownerToken)

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/channels/:id/subscribers', () => ownerToken)

    // should return 401 if not authenticated
    expectUnauthorized('get', '/api/channels/:id/subscribers')

    it('should return 404 if channel not found', async () => {
        const fakeChannelId = channel.id.slice(0, -4) + 'fake'
        
        const response = await request(app)
            .get(`/api/channels/${fakeChannelId}/subscribers`)
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(404)
    })

})