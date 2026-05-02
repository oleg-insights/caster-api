import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'

import { app } from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'
import { redis } from '../../src/lib/redis.js'

import { toUserPrivateDto } from '../../src/mappers/user.mapper.js'
import { generateTokens } from '../../src/utils/jwt.util.js'

import { createUser, createSession } from '../helpers/factories.js'

import type { User, Session } from '@prisma/client'
import type { UserPrivateDto } from '../../src/mappers/user.mapper.js'

describe('POST /api/auth/register', () => {
    
    const validRegisterData = {
        name: 'user',
        email: 'user@test.com',
        password: 'user_password'
    }

    const invalidItems = [
        { payload: { name: 25 }, reason: 'name is not a string' },
        { payload: { email: 'not-a-valid-email' }, reason: 'email format is invalid' },
        { payload: { password: 'p' }, reason: 'password is too short' }
    ]
    
    beforeEach(async () => {
        await prisma.user.deleteMany()
    })
    
    it('should return 201 and create user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(validRegisterData)

        expect(response.status).toBe(201)

        const createdUser: UserPrivateDto = response.body.data?.user

        expect(createdUser).not.toBeNull()
        
        const userInDb = await prisma.user.findUnique({ where: { id: createdUser.id } })

        expect(userInDb).not.toBeNull()
        expect(userInDb!.password).not.toBe(validRegisterData.password)
    })

    it('should return permitted fields only', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(validRegisterData)

        expect(response.status).toBe(201)
        
        const user: UserPrivateDto = response.body.data?.user
        const actualKeys = Object.keys(user).sort()

        const expectedDto = toUserPrivateDto({} as any)
        const expectedKeys = Object.keys(expectedDto).sort()
        
        expect(actualKeys).toEqual(expectedKeys)
    })

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...validRegisterData, ...item.payload })

            expect(response.status).toBe(400)
        })
    })

    it('should return 409 if email already in use', async () => {
        const user = await createUser({ email: validRegisterData.email })

        expect(user).toBeDefined()

        const response = await request(app)
            .post('/api/auth/register')
            .send(validRegisterData )
        
        expect(response.status).toBe(409)
    })

})

describe('POST /api/auth/login', () => {
    
    const validAuthData = {
        email: 'user@test.com',
        password: 'user_password'
    }
    
    const invalidItems = [
        { payload: { email: 'not-a-valid-email' }, reason: 'email format is invalid' },
        { payload: { password: '' }, reason: 'password is not provided' }
    ]
    
    const incorrectItems = [
        { payload: { email: 'incorrect@test.com' }, reason: 'email is incorrect' },
        { payload: { password: `incorrect_password` }, reason: 'password is incorrect' }
    ]

    beforeEach(async () => {
        await prisma.user.deleteMany()
    })
    
    it('should return 200 and generate tokens', async () => {
        const loginData = {email: 'user@test.com', password: 'user_password'}
        const user = await createUser(loginData)
        
        const response = await request(app)
            .post('/api/auth/login')
            .send(loginData)

        expect(response.status).toBe(200)

        const userInDb = await prisma.user.findUnique({ where: { id: user.id } })

        expect(userInDb).not.toBeNull()

        const session = await prisma.session.findFirst({ where: { userId: userInDb!.id } })

        expect(session).not.toBeNull()

        const accessToken: string = response.body.data?.accessToken

        expect(accessToken).toBeDefined()

        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as {id: string, role: string}

        expect(decodedAccessToken).toMatchObject({id: user.id, role: user.role})

        const cookies = response.get('Set-Cookie') as string[]
        const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken='))

        expect(refreshTokenCookie).toBeDefined()
        expect(refreshTokenCookie).toContain('HttpOnly')
    })
    
    it('should return permitted fields only', async () => {
        const authData = {email: 'user@test.com', password: 'user_password'}
        
        const user = await createUser(authData)

        expect(user).toBeDefined()
        
        const response = await request(app)
            .post('/api/auth/login')
            .send(authData)

        expect(response.status).toBe(200)
        
        const responseUser: UserPrivateDto = response.body.data?.user
        const actualKeys = Object.keys(responseUser).sort()

        const expectedDto = toUserPrivateDto({} as any)
        const expectedKeys = Object.keys(expectedDto).sort()
        
        expect(actualKeys).toEqual(expectedKeys)
    })

    // should return 400 if email or password are invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ ...validAuthData, ...item.payload })

            expect(response.status).toBe(400)
        })
    })

    // should return 401 if email or password are incorrect
    incorrectItems.forEach(item => {
        it(`should return 401 if ${item.reason}`, async () => {
            const user = await createUser(validAuthData)

            expect(user).toBeDefined()

            const response = await request(app)
                .post('/api/auth/login')
                .send({ ...validAuthData, ...item.payload })

            expect(response.status).toBe(401)
            expect(response.body.message).toBe('Invalid Credentials')
        })
    })

})

describe('POST /api/auth/refresh', () => {

    let user: User
    let refreshToken: string
    let session: Session

    beforeEach(async () => {
        await prisma.user.deleteMany()
        
        user = await createUser()
        const tokens = generateTokens(user.id, user.role)
        refreshToken = tokens.refreshToken
        session = await createSession(user.id, tokens)
    })
    
    it('should return 201 and generate tokens', async () => {
        const response = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [`refreshToken=${refreshToken}`])
        
        expect(response.status).toBe(201)

        const accessToken = response.body.data?.accessToken

        expect(accessToken).toBeDefined()

        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as {id: string, role: string}

        expect(decodedAccessToken).toMatchObject({id: user.id, role: user.role})

        const cookies = response.get('Set-Cookie') as string[]
        const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken='))

        expect(refreshTokenCookie).toBeDefined()
        expect(refreshTokenCookie).toContain('HttpOnly')

        const sessionInDb = await prisma.session.findUnique({ where: { id: session.id } })

        expect(sessionInDb).toBeNull()
    })

    it('should return 401 if refreshToken is invalid', async () => {
        const invalidRefreshToken = 'invalid-token-123'

        const response = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [`refreshToken=${invalidRefreshToken}`])

        expect(response.status).toBe(401)
    })

    it('should return 401 if refreshToken is expired', async () => {
        const expiredTokens = generateTokens(user.id, user.role, {
            expiresRefreshInDays: -1
        })
        const expiredRefreshToken = expiredTokens.refreshToken
        const session = await createSession(user.id, expiredTokens)

        const response = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [`refreshToken=${expiredRefreshToken}`])

        expect(response.status).toBe(401)
        
        const sessionInDb = await prisma.session.findUnique({ where: { id: session.id } })

        expect(sessionInDb).toBeNull()
    })

    it('should return 401 if refreshToken is missing', async () => {
        const response = await request(app)
            .post('/api/auth/refresh')

        expect(response.status).toBe(401)
    })

    it('should return 401 if session not found', async () => {
        await prisma.session.deleteMany()
        
        const response = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', [`refreshToken=${refreshToken}`])

        expect(response.status).toBe(401)
    })

})

describe('POST /api/auth/logout', () => {

    let user: User
    let accessToken: string
    let refreshToken: string
    let session: Session

    beforeEach(async () => {
        await prisma.user.deleteMany()

        user = await createUser()
        const tokens = generateTokens(user.id, user.role)
        accessToken = tokens.accessToken
        refreshToken = tokens.refreshToken
        session = await createSession(user.id, tokens)
    })
    
    it('should return 204 and close session', async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', [`refreshToken=${session.refreshToken}`])
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(204)

        const sessionInDb = await prisma.session.findFirst({ where: { refreshToken } })

        expect(sessionInDb).toBeNull()

        const tokenInRedis = await redis.get(`blacklist:${accessToken}`)

        expect(tokenInRedis).not.toBeNull()

        const cookies = response.get('Set-Cookie') as string[]
        const refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken='))

        expect(refreshTokenCookie).toBeDefined()
        expect(refreshTokenCookie).toMatch(/refreshToken=;/)
    })

    it('should return 401 if accessToken is expired', async () => {
        const expiredToken = jwt.sign(
            {id: user.id, role: user.role}, 
            process.env.JWT_ACCESS_SECRET!,
            {expiresIn: '-1d'}
        )
         
        const response = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', [`refreshToken=${refreshToken}`])
            .set('Authorization', `Bearer ${expiredToken}`)

        expect(response.status).toBe(401)
    })

})