import request from 'supertest'
import { it, expect } from 'vitest'

import { app } from '../../src/app.js'

type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'

export const expectUnauthorized = (method: HttpMethod, path: string) => {
    const nonExistentItemId = 'clj80z9v8000008l2hf3f1v9e'
    
    it('should return 401 if not authenticated', async () => {
        const response = await request(app)[method](path.replace(':id', nonExistentItemId))

        expect(response.status).toBe(401)
    })
}