import request from 'supertest'
import { it, expect } from 'vitest'

import { app } from '../../src/app.js'

type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'

export const expectInvalidCuid = (method: HttpMethod, path: string, token?: () => string | null) => {
    it('should return 400 if id format is not cuid', async () => {
        const invalidId = 'not-cuid-123'

        const req = request(app)
            [method](path.replace(':id', invalidId))

        if (token) {
            req.set('Authorization', `Bearer ${token()}`)
        }

        const response = await req

        expect(response.status).toBe(400)
    })
}

export const expectInvalidPagination = (method: HttpMethod, path: string, token?: () => string | null) => {
    it('should return 400 if query params are invalid', async () => {
        const badQueryParams =  [ 
            { page: 'not-a-number' },
            { page: 0 },
            { limit: 'not-a-number' },
            { limit: 0 },
            { sortBy: 'not-a-valid-param' },
            { sortBy: 123 },
            { order: 'not-a-valid-param' },
            { order: 5 }
        ]

        for (const param of badQueryParams) {
            const req = request(app)
                [method](path)
                .query(param)

            if (token) {
                req.set('Authorization', `Bearer ${token()}`)
            }

            const response = await req

            expect(response.status).toBe(400)
        }
    })
}