import bcrypt from 'bcrypt'
import request from 'supertest'
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

import { app } from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'
import { redis } from '../../src/lib/redis.js'

import { toUserPublicDto, toUserPrivateDto } from '../../src/mappers/user.mapper.js'
import { generateTokens } from '../../src/utils/jwt.util.js'

import { expectInvalidCuid, expectInvalidPagination } from '../helpers/validation.helper.js'
import { expectUnauthorized } from '../helpers/auth.helper.js'
import { 
    createUser,
    createChannel,
    createPost,
    createComment,
    createPostLike,
    createCommentLike,
    createSubscription,
    createSession
} from '../helpers/factories.js'

import type { User, Channel, Post, Comment, Like, Subscription, Session } from '@prisma/client'
import type { IMeta } from '../../src/types/meta.js'
import type { UserPublicDto, UserPrivateDto } from '../../src/mappers/user.mapper.js'

describe('GET /api/users/me', () => {

    let profileOwner: User
    let profileOwnerToken: string

    beforeAll(async () => {
        await prisma.user.deleteMany()

        profileOwner = await createUser()
        profileOwnerToken = generateTokens(profileOwner.id, profileOwner.role).accessToken
    })

    it('should return 200 and own profile data', async () => {
        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${profileOwnerToken}`)

        expect(response.status).toBe(200)

        const foundUser: UserPrivateDto = response.body.data?.user

        expect(foundUser).toBeTruthy()
        expect(foundUser).toMatchObject({
            id: profileOwner.id,
            name: profileOwner.name
        })
    })

    it('should return permitted fields only', async () => {
        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${profileOwnerToken}`)

        expect(response.status).toBe(200)

        const responseUser: UserPrivateDto = response.body.data?.user
        const userKeys = Object.keys(responseUser).sort()

        const expectedDto = toUserPrivateDto({} as any)
        const expectedKeys = Object.keys(expectedDto).sort()

        expect(userKeys).toEqual(expectedKeys)
    })

    // should return 401 if not authenticated
    expectUnauthorized('get', '/api/users/me')

    it('should return 404 if account deleted', async () => {
        await prisma.user.delete({ where: { id: profileOwner.id } })

        const response = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${profileOwnerToken}`)

        expect(response.status).toBe(404)

        const foundUser: UserPrivateDto = response.body.data?.user

        expect(foundUser).toBeFalsy()
    })

})

describe('GET /api/users/:id', () => {

    let profileOwner: User
    let profileOwnerToken: string
    let anotherUser: User
    let anotherUserToken: string

    beforeAll(async () => {
        await prisma.user.deleteMany()

        profileOwner = await createUser()
        profileOwnerToken = generateTokens(profileOwner.id, profileOwner.role).accessToken

        anotherUser = await createUser()
        anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken
    })

    it('should return 200 and profile data', async () => {
        const response = await request(app)
            .get(`/api/users/${profileOwner.id}`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(200)

        const foundUser: UserPublicDto = response.body.data?.user

        expect(foundUser).toBeTruthy()
        expect(foundUser).toMatchObject({
            id: profileOwner.id,
            name: profileOwner.name
        })
    })

    it('should return permitted fields only', async () => {
        const response = await request(app)
            .get(`/api/users/${profileOwner.id}`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(200)

        const responseUser: UserPublicDto = response.body.data?.user
        const actualKeys = Object.keys(responseUser).sort()

        const expectedDto = toUserPublicDto({} as any)
        const expectedKeys = Object.keys(expectedDto).sort()

        expect(actualKeys).toEqual(expectedKeys)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('get', '/api/users/:id', () => profileOwnerToken)

    // should return 401 if not authenticated
    expectUnauthorized('get', '/api/users/:id')

    it('should return 404 if user not found', async () => {
        await prisma.user.delete({ where: { id: profileOwner.id } })

        const response = await request(app)
            .get(`/api/users/${profileOwner.id}`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(404)

        const foundUser: UserPublicDto = response.body.data?.user

        expect(foundUser).toBeFalsy()
    })

})

describe('PATCH /api/users/me', () => {

    const invalidItems = [
        { payload: { name: 1000 }, reason: 'name is not a string' },
        { payload: { email: 'new_email' }, reason: 'email format is invalid' },
        { payload: { avatar: 'https://new_avatar.exe' }, reason: 'avatar format is invalid' },
        { payload: { password: 'p' }, reason: 'password is too short' },
        { payload: { telegramNotifications: 'true' }, reason: 'telegramNotifications is not a boolean value' },
        { payload: { telegramId: 1234567890 }, reason: 'telegram id is not a string' },
        { payload: { role: 'ADMIN' }, reason: 'provided fields are not allowed' }
    ]
    
    let profileOwner: User
    let profileOwnerToken: string
    let anotherUser: User
    let anotherUserToken: string 
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        profileOwner = await createUser({ role: 'USER' })
        anotherUser = await createUser({ role: 'USER' })
        anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken
    })

    beforeEach(async () => {
        profileOwner = await prisma.user.update({
            where: { id: profileOwner.id },
            data: {
                name: 'original_name',
                email: 'original_email@test.com',
                avatar: 'https://original_avatar.png',
                password: 'original_password',
                telegramNotifications: true,
                telegramId: '1'.repeat(10)
            }
        })
        profileOwnerToken = generateTokens(profileOwner.id, profileOwner.role).accessToken
    })

    it('should return 200 and change provided fields', async () => {
        const response = await request(app)
            .patch(`/api/users/me`)
            .send({ name: 'changed_name' })
            .set('Authorization', `Bearer ${profileOwnerToken}`)

        expect(response.status).toBe(200)

        const profileInDb = await prisma.user.findUniqueOrThrow({ where: { id: profileOwner.id } })
        
        expect(profileInDb).toBeTruthy()
        expect(profileInDb).toMatchObject({
            name: 'changed_name',
            email: profileOwner.email
        })
    })

    it('should return permitted fields only', async () => {
        const response = await request(app)
            .patch(`/api/users/me`)
            .send({ name: 'changed_name' })
            .set('Authorization', `Bearer ${profileOwnerToken}`)

        expect(response.status).toBe(200)

        const responseUser: UserPrivateDto = response.body.data?.user
        const userKeys = Object.keys(responseUser).sort()

        const expectedDto = toUserPrivateDto({} as any)
        const expectedKeys = Object.keys(expectedDto).sort()

        expect(userKeys).toEqual(expectedKeys)
    })

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .patch(`/api/users/me`)
                .send({ ...item.payload })
                .set('Authorization', `Bearer ${profileOwnerToken}`)

            expect(response.status).toBe(400)
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('patch', '/api/users/me')

    it('should return 409 if email already in use', async () => {
        const response = await request(app)
            .patch(`/api/users/me`)
            .send({ email: anotherUser.email })
            .set('Authorization', `Bearer ${profileOwnerToken}`)

        expect(response.status).toBe(409)

        const profileInDb = await prisma.user.findUniqueOrThrow({ where: { id: profileOwner.id } })

        expect(profileInDb.email).toBe(profileOwner.email)
    })

})

describe('PATCH /api/users/me/password', () => {

    let validPasswords = {
        password: 'password',
        oldPassword: 'oldPassword'
    }
    
    let invalidItems = [
        { payload: { password: 'q' }, reason: 'password is too short' },
        { payload: { password: 'q'.repeat(100) }, reason: 'password is too long' },
        { payload: { password: 25 }, reason: 'password is not a string' },
        { payload: { oldPassword: 25 }, reason: 'oldPassword is not a string' }
    ]
    
    let owner: User
    
    beforeEach(async () => {
        await prisma.user.deleteMany()

        owner = await createUser({ password: 'old_password' })
    })
    
    it('should return 204, change password, clear sessions and cookie', async () => {
        const tokens = generateTokens(owner.id, owner.role)
        const ownerToken = tokens.accessToken

        await createSession(owner.id, tokens)
        
        const response = await request(app)
            .patch('/api/users/me/password')
            .send({ password: 'new_password', oldPassword: 'old_password' })
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(204)

        const userInDb = await prisma.user.findUnique({ where: { id: owner.id } })

        expect(userInDb).not.toBeNull()

        const newHashedPassword = userInDb!.password
        const isMatch = await bcrypt.compare('new_password', newHashedPassword)

        expect(isMatch).toBe(true)

        const sessionsCount = await prisma.session.count({ where: { userId: owner.id } })

        expect(sessionsCount).toBe(0)

        const tokenInRedis = await redis.get(`blacklist:${ownerToken}`)

        expect(tokenInRedis).not.toBeNull()

        const cookies = response.get('Set-Cookie') as string[]
        const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken='))

        expect(refreshTokenCookie).toBeDefined()
        expect(refreshTokenCookie).toMatch(/refreshToken=;/)
    })

    // should return 400 if passwords are invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const tokens = generateTokens(owner.id, owner.role)
            const ownerToken = tokens.accessToken
            
            const response = await request(app)
                .patch('/api/users/me/password')
                .send({ ...validPasswords, ...item.payload })
                .set('Authorization', `Bearer ${ownerToken}`)

            expect(response.status).toBe(400)
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('patch', '/api/users/me/password')

})

describe('DELETE /api/users/:id', () => {

    let profileOwner: User
    let profileOwnerToken: string
    let session: Session
    
    beforeEach(async () => {
        await prisma.user.deleteMany()
        
        profileOwner = await createUser({ role: 'USER' })
        const tokens = generateTokens(profileOwner.id, profileOwner.role)
        profileOwnerToken = tokens.accessToken
        session = await createSession(profileOwner.id, tokens)
    })
    
    it('should return 204, remove user, clear cookie and sessions', async () => {
        const response = await request(app)
            .delete(`/api/users/${profileOwner.id}`)
            .set('Authorization', `Bearer ${profileOwnerToken}`)

        expect(response.status).toBe(204)

        const profileInDb = await prisma.user.findUnique({ where: { id: profileOwner.id } })

        expect(profileInDb).toBeNull()

        const accessTokenInBlacklist = await redis.get(`blacklist:${profileOwnerToken}`)

        expect(accessTokenInBlacklist).not.toBeNull()

        const cookies = response.get('Set-Cookie') as String[]
        const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken='))

        expect(refreshTokenCookie).toBeDefined()
        expect(refreshTokenCookie).toMatch(/refreshToken=;/)

        const sessionsCount = await prisma.session.count({ where: { userId: profileOwner.id } })

        expect(sessionsCount).toBe(0)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('delete', '/api/users/:id', () => profileOwnerToken)

    // should return 401 if not authenticated
    expectUnauthorized('delete', '/api/users/:id')

    it('should return 403 if authenticated but not an owner or admin', async () => {
        const anotherUser = await createUser({ role: 'USER' })
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .delete(`/api/users/${profileOwner.id}`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)

        const ownerInDb = await prisma.user.findUnique({ where: { id: profileOwner.id } })

        expect(ownerInDb).not.toBeNull()
    })

    it('should return 404 if user not found', async () => {
        const fakeUserId = profileOwner.id.slice(0, -4) + 'fake'

        const admin = await createUser({ role: 'ADMIN' })
        const adminToken = generateTokens(admin.id, admin.role).accessToken

        const response = await request(app)
            .delete(`/api/users/${fakeUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(404)
    })

})

describe('GET /api/users/:id/comments', () => {

    let post: Post
    let commentator: User
    let commentatorToken: string
    let anotherUser: User
    let anotherUserToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        const owner = await createUser()
        const channel = await createChannel(owner.id)

        post = await createPost(owner.id, channel.id)
        
        commentator = await createUser()
        commentatorToken = generateTokens(commentator.id, commentator.role).accessToken

        anotherUser = await createUser({ role: 'USER' })
        anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken
    })
 
    it('should return 200 and list of user comments based on pagination', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        
        for (const _ of Array.from({length: 5})) {
            await createComment(commentator.id, post.id)
            await sleep(10)
        }
        
        const response = await request(app)
            .get(`/api/users/${commentator.id}/comments`)
            .query({page: 2, limit: 2, sortBy: 'createdAt', order: 'desc'})
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(200)

        const comments: Comment[] = response.body.data?.comments

        expect(Array.isArray(comments)).toBe(true)
        expect(comments).toHaveLength(2)

        const time_1 = new Date(comments[0].createdAt).getTime()
        const time_2 = new Date(comments[1].createdAt).getTime()

        expect(time_1).toBeGreaterThan(time_2)

        const meta: IMeta = response.body.data?.meta

        expect(meta).toBeTruthy()
        expect(meta).toMatchObject({
            totalItems: 5,
            totalPages: 3,
            currentPage: 2,
            limit: 2
        })
    })

    it('should return isLikedByMe: true if user liked comment', async () => {
        await prisma.comment.deleteMany()
        
        const comment = await createComment(commentator.id, post.id)
        await createCommentLike(commentator.id, comment.id)

        const response = await request(app)
            .get(`/api/users/${commentator.id}/comments`)
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(200)
        
        const comments = response.body.data?.comments

        expect(comments).toHaveLength(1)
        expect(comments[0]).toHaveProperty('isLikedByMe')
        expect(comments[0].isLikedByMe).toBe(true)
    })

    // should return 400 if id format is not cuid 
    expectInvalidCuid('get', '/api/users/:id/comments', () => commentatorToken)

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/users/:id/comments', () => commentatorToken)

    // should return 401 if not authenticated
    expectUnauthorized('get', '/api/users/:id/comments')

    it('should return 403 if authenticated but not an admin or owner', async () => {
        const response = await request(app)
            .get(`/api/users/${commentator.id}/comments`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)
    })

    it('should return 404 if user not found', async () => {
        const fakeUserId = commentator.id.slice(0, -4) + 'fake'

        const admin = await createUser({ role: 'ADMIN' })
        const adminToken = generateTokens(admin.id, admin.role).accessToken

        const response = await request(app)
            .get(`/api/users/${fakeUserId}/comments`)
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(404)
    })

})

describe('GET /api/users/me/likes', () => {

    let owner: User
    let channel: Channel
    let me: User
    let meToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        channel = await createChannel(owner.id)
        me = await createUser()
        meToken = generateTokens(me.id, me.role).accessToken
    })

    it('should return 200 and list of user likes based on pagination', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        
        for (const _ of Array.from({length: 5})) {
            const post = await createPost(owner.id, channel.id)
            const comment = await createComment(owner.id, post.id)
            await createPostLike(me.id, post.id)
            await sleep(10)
            await createCommentLike(me.id, comment.id)
            await sleep(10)
        }
        
        const response = await request(app)
            .get('/api/users/me/likes')
            .query({page: 2, limit: 2, sortBy: 'createdAt', order: 'desc'})
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(200)
        
        const likes: Like[] = response.body.data?.likes

        expect(Array.isArray(likes)).toBe(true)
        expect(likes).toHaveLength(2)
        expect(likes[0]).toHaveProperty('type')
        expect(likes[0]).toHaveProperty('item')

        const time_1 = new Date(likes[0].createdAt).getTime()
        const time_2 = new Date(likes[1].createdAt).getTime()

        expect(time_1).toBeGreaterThan(time_2)

        const meta: IMeta = response.body.data?.meta

        expect(meta).toBeTruthy()
        expect(meta).toMatchObject({
            totalItems: 10,
            totalPages: 5,
            currentPage: 2,
            limit: 2
        })
    })

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/users/me/likes', () => meToken)

    // should return 401 if not authenticated
    expectUnauthorized('get', '/api/users/me/likes')

})

describe('GET /api/users/me/subscriptions', () => {

    let owner: User
    let me: User
    let meToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        me = await createUser()
        meToken = generateTokens(me.id, me.role).accessToken
    })
   
    it('should return 200 and list of user subscriptions based on pagination', async () => {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        
        for (const _ of Array.from({length: 5})) {
            const channel = await createChannel(owner.id)
            await createSubscription(me.id, channel.id)
            await sleep(10)
        }
        
        const response = await request(app)
            .get('/api/users/me/subscriptions')
            .query({page: 2, limit: 2, sortBy: 'createdAt', order: 'desc'})
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(200)
        
        const subscriptions: Subscription[] = response.body.data?.subscriptions

        expect(Array.isArray(subscriptions)).toBe(true)
        expect(subscriptions).toHaveLength(2)
        expect(subscriptions[0]).toHaveProperty('channel')

        const time_1 = new Date(subscriptions[0].createdAt).getTime()
        const time_2 = new Date(subscriptions[1].createdAt).getTime()

        expect(time_1).toBeGreaterThan(time_2)

        const meta: IMeta = response.body.data?.meta
 
        expect(meta).toBeTruthy()
        expect(meta).toMatchObject({
            totalItems: 5,
            totalPages: 3,
            currentPage: 2,
            limit: 2
        })
    })

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/users/me/subscriptions', () => meToken)

    // should return 401 if not authenticated
    expectUnauthorized('get', '/api/users/me/subscriptions')

})

describe('POST /api/users/me/subscriptions', () => {

    const invalidItems = [
        { payload: { channelId: 'not-cuid-id' }, reason: 'channelId is not a valid cuid' }
    ]
    
    let channel: Channel
    let me: User
    let meToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        const owner = await createUser()
        
        channel = await createChannel(owner.id)
        me = await createUser()
        meToken = generateTokens(me.id, me.role).accessToken
    })

    beforeEach(async () => {
        await prisma.subscription.deleteMany()
    })

    it('should return 201 and create subscription', async () => {
        const response = await request(app)
            .post('/api/users/me/subscriptions')
            .send({ channelId: channel.id })
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(201)

        const subInDb = await prisma.subscription.findUnique({ 
            where: { 
                subscriberId_channelId: {
                    subscriberId: me.id,
                    channelId: channel.id
                } 
            } 
        })

        expect(subInDb).toBeTruthy()
    })

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .post('/api/users/me/subscriptions')
                .send({ ...item.payload })
                .set('Authorization', `Bearer ${meToken}`)

            expect(response.status).toBe(400)

            const subInDb = await prisma.subscription.findFirst({ 
                where: { subscriberId: me.id } 
            })

            expect(subInDb).toBeNull()
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('post', '/api/users/me/subscriptions')

    it('should return 404 if channel not found', async () => {
        const fakeChannelId = channel.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .post('/api/users/me/subscriptions')
            .send({ channelId: fakeChannelId })
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(404)

        const subInDb = await prisma.subscription.findFirst({
            where: { subscriberId: me.id }
        })

        expect(subInDb).toBeNull()
    })

    it('should return 409 if subscription already exists', async () => {
        await createSubscription(me.id, channel.id)

        const response = await request(app)
            .post('/api/users/me/subscriptions')
            .send({ channelId: channel.id })
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(409)

        const subsInDb = await prisma.subscription.findMany({
            where: {
                subscriberId: me.id,
                channelId: channel.id
            }
        })

        expect(Array.isArray(subsInDb)).toBe(true)
        expect(subsInDb).toHaveLength(1)
    })

})

describe('DELETE /api/users/me/subscriptions/:channelId', () => {

    let owner: User
    let me: User
    let meToken: string
    let channel: Channel
    let sub: Subscription
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        channel = await createChannel(owner.id)
        me = await createUser()
        meToken = generateTokens(me.id, me.role).accessToken
    })

    beforeEach(async () => {
        await prisma.subscription.deleteMany()
        
        sub = await createSubscription(me.id, channel.id)
    })

    it('should return 204 and remove subscription from db', async () => {
        const response = await request(app)
            .delete(`/api/users/me/subscriptions/${channel.id}`)
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(204)

        const subInDb = await prisma.subscription.findUnique({ 
            where: {
                subscriberId_channelId: {
                    subscriberId: me.id,
                    channelId: channel.id
                }
            }
        })

        expect(subInDb).toBeNull()
    })

    // should return 400 if channelId format is not cuid
    expectInvalidCuid('delete', '/api/users/me/subscriptions/:id', () => meToken)

    // should return 401 if not authenticated
    expectUnauthorized('delete', '/api/users/me/subscriptions/:id')

    it('should return 404 if subscription does not exists', async () => {
        const anotherChannel = await createChannel(owner.id)

        const response = await request(app)
            .delete(`/api/users/me/subscriptions/${anotherChannel.id}`)
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(404)
    })

    it('should return 404 if channel not found', async () => {
        const fakeChannelId = channel.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .delete(`/api/users/me/subscriptions/${fakeChannelId}`)
            .set('Authorization', `Bearer ${meToken}`)

        expect(response.status).toBe(404)
    })

})