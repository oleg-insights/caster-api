import request from 'supertest'
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

import { app } from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'

import { toUserPrivateDto } from '../../src/mappers/user.mapper.js'
import { generateTokens } from '../../src/utils/jwt.util.js'

import { expectInvalidPagination, expectInvalidCuid } from '../helpers/validation.helper.js'
import { expectUnauthorized } from '../helpers/auth.helper.js'
import { createUser } from '../helpers/factories.js'

import type { User } from '@prisma/client'
import type { IMeta } from '../../src/types/meta.js'
import type { UserPrivateDto } from '../../src/mappers/user.mapper.js'

describe('GET /api/admin/users', () => {

    let admin: User
    let adminToken: string
    
    beforeEach(async() => {
        await prisma.user.deleteMany()

        admin = await createUser({role: 'ADMIN'})
        adminToken = generateTokens(admin.id, admin.role).accessToken
    })
    
    it('should return 200 and list of users based on pagination', async () => {
        const testUsers = await Promise.all(
            Array.from({length: 4}).map(() => createUser({role: 'USER'}))
        )

        expect(testUsers[0]).toBeTruthy()

        const idsToUpdate = [testUsers[0].id, testUsers[2].id]

        await prisma.user.updateMany({
            where: { id: { in: idsToUpdate } },
            data: { role: 'ADMIN' }
        })

        const response = await request(app)
            .get('/api/admin/users')
            .query({ page: 2, limit: 2, sortBy: 'role', order: 'desc' })
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)

        const users: UserPrivateDto[] = response.body.data?.users
        
        expect(Array.isArray(users)).toBe(true)
        expect(users).toHaveLength(2)
        users.forEach(user => {
            expect(user.role).toBe('ADMIN')
        })

        const meta: IMeta = response.body.data?.meta

        expect(meta.totalItems).toBe(5)
        expect(meta.totalPages).toBe(3)
        expect(meta.currentPage).toBe(2)
        expect(meta.limit).toBe(2)
    })

    it('should return permitted fields only', async () => {
        await createUser({role: 'USER'})
        
        const response = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)

        const responseUsers: UserPrivateDto[] = response.body.data?.users
        const userKeys = Object.keys(responseUsers[0]).sort()

        const expectedDto = toUserPrivateDto({} as any)
        const expectedKeys = Object.keys(expectedDto).sort()

        expect(userKeys).toEqual(expectedKeys)
    })

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/admin/users', () => adminToken)

    // should return 401 if not authenticated
    expectUnauthorized('get', '/api/admin/users')

    it('should return 403 if authenticated but not an admin', async () => {
        const user = await createUser({role: 'USER'})
        const userToken = generateTokens(user.id, user.role).accessToken

        const response = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(403)
    })

})

describe('PATCH /api/admin/users/:id/role', () => {

    let admin: User
    let adminToken: string

    beforeEach(async () => {
        await prisma.user.deleteMany()
        
        admin = await createUser({role: 'ADMIN'})
        adminToken = generateTokens(admin.id, admin.role).accessToken
    })
    
    it('should return 200 and change user role', async () => {
        const user = await createUser({role: 'USER'})

        const response = await request(app)
            .patch(`/api/admin/users/${user.id}/role`)
            .send({role: 'ADMIN'})
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)

        const updatedUser: UserPrivateDto = response.body.data?.user

        expect(updatedUser).not.toBeNull()
        expect(updatedUser.role).toBe('ADMIN')

        const userInDb = await prisma.user.findUnique({ where: { id: user.id } })

        expect(userInDb?.role).toBe('ADMIN')
    })
    
    it('should return permitted fields only', async () => {
        const user = await createUser({role: 'USER'})
        
        const response = await request(app)
            .patch(`/api/admin/users/${user.id}/role`)
            .send({role: 'ADMIN'})
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(200)

        const responseUser: UserPrivateDto = response.body.data?.user
        const userKeys = Object.keys(responseUser).sort()

        const expectedDto = toUserPrivateDto({} as any)
        const expectedKeys = Object.keys(expectedDto).sort()

        expect(userKeys).toEqual(expectedKeys)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('patch', '/api/admin/users/:id/role', () => adminToken)

    it('should return 400 if role is invalid', async () => {
        const userBeforeUpdate = await createUser({role: 'USER'})

        const response = await request(app)
            .patch(`/api/admin/users/${userBeforeUpdate.id}/role`)
            .send({role: 'INVALID_ROLE'})
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(400)
    })

    // should return 401 if not authenticated
    expectUnauthorized('patch', '/api/admin/users/:id/role')

    it('should return 403 if authenticated but not an admin', async () => {
        const user = await createUser({role: 'USER'})
        const userToken = generateTokens(user.id, user.role).accessToken

        const response = await request(app)
            .patch(`/api/admin/users/${user.id}/role`)
            .send({role: 'ADMIN'})
            .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(403)
    })

    it('should return 404 if user not found', async () => {
        const fakeUserId = admin.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .patch(`/api/admin/users/${fakeUserId}/role`)
            .send({role: 'ADMIN'})
            .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(404)
    })

})