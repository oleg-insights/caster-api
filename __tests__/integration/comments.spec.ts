import request from 'supertest'
import { describe, it, expect, beforeEach, beforeAll } from 'vitest'

import { app } from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'

import { generateTokens } from '../../src/utils/jwt.util.js'

import { 
    createUser, 
    createChannel, 
    createPost, 
    createComment,
    createCommentLike
} from '../helpers/factories.js'
import { expectInvalidCuid } from '../helpers/validation.helper.js'
import { expectUnauthorized } from '../helpers/auth.helper.js'

import type { User, Post, Comment, Like } from '@prisma/client'

describe('PATCH /api/comments/:id', () => {

    const validPatchData = {
        text: 'valid_text'
    }

    const invalidItems = [
        { payload: { text: 1000 }, reason: 'text is not a string' }
    ]
    
    let post: Post
    let comment: Comment
    let commentator: User
    let commentatorToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        const owner = await createUser()
        const channel = await createChannel(owner.id)

        post = await createPost(owner.id, channel.id)
        commentator = await createUser()
        commentatorToken = generateTokens(commentator.id, commentator.role).accessToken
    })

    beforeEach(async () => {
        await prisma.comment.deleteMany()

        comment = await createComment(commentator.id, post.id, {
            text: 'original_text'
        })
    })
    
    it('should return 200 and change provided fields', async () => {
        const response = await request(app)
            .patch(`/api/comments/${comment.id}`)
            .send({ text: 'changed_text' })
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(200)

        const changedComment: Comment = response.body.data?.comment

        expect(changedComment).toBeTruthy()

        const commentInDb = await prisma.comment.findUniqueOrThrow({ 
            where: { id: changedComment.id } 
        })

        expect(commentInDb).toMatchObject({ text: 'changed_text' })

        const createdTime = new Date(commentInDb.createdAt).getTime()
        const updatedTime = new Date(commentInDb.updatedAt).getTime()

        expect(updatedTime).toBeGreaterThan(createdTime)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('patch', '/api/comments/:id', () => commentatorToken)

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .patch(`/api/comments/${comment.id}`)
                .send({ ...validPatchData, ...item.payload })
                .set('Authorization', `Bearer ${commentatorToken}`)

            expect(response.status).toBe(400)

            const commentInDb = await prisma.comment.findUnique({ where: { id: comment.id } })

            expect(commentInDb).toBeTruthy()
            expect(commentInDb).toMatchObject({
                text: 'original_text'
            })
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('patch', '/api/comments/:id')

    it('should return 403 if authenticated but not an author', async () => {
        const anotherUser = await createUser({ role: 'USER' })
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .patch(`/api/comments/${comment.id}`)
            .send(validPatchData )
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)

        const commentInDb = await prisma.comment.findUnique({ where: { id: comment.id } })

        expect(commentInDb).toBeTruthy()
        expect(commentInDb).toMatchObject({
            text: 'original_text'
        })
    })

    it('should return 404 if comment not found', async () => {
        const fakeCommentId = comment.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .patch(`/api/comments/${fakeCommentId}`)
            .send(validPatchData )
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(404)
    })

})

describe('DELETE /api/comments/:id', () => {

    let post: Post
    let commentator: User
    let commentatorToken: string
    let comment: Comment
    
    beforeAll(async () => {
        await prisma.user.deleteMany()
        
        const owner = await createUser()
        const channel = await createChannel(owner.id)

        post = await createPost(owner.id, channel.id)
        commentator = await createUser()
        commentatorToken = generateTokens(commentator.id, commentator.role).accessToken
    })

    beforeEach(async () => {
        await prisma.comment.deleteMany()

        comment = await createComment(commentator.id, post.id)
    })

    it('should return 204 and remove comment from db', async () => {
        const response = await request(app)
            .delete(`/api/comments/${comment.id}`)
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(204)

        const commentInDb = await prisma.comment.findUnique({ where: { id: comment.id } })

        expect(commentInDb).toBeNull()
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('delete', '/api/comments/:id', () => commentatorToken)

    // should return 401 if not authenticated
    expectUnauthorized('delete', '/api/comments/:id')

    it('should return 403 if authenticated but not an admin or author', async () => {
        const anotherUser = await createUser({ role: 'USER' })
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .delete(`/api/comments/${comment.id}`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)

        const commentInDb = await prisma.comment.findUnique({ where: { id: comment.id } })

        expect(commentInDb).toBeTruthy()
    })

    it('should return 404 if comment not found', async () => {
        const fakeCommentId = comment.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .delete(`/api/comments/${fakeCommentId}`)
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(404)
    })

})

describe('POST /api/comments/:id/likes', () => {

    let comment: Comment
    let liker: User
    let likerToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()
        
        const owner = await createUser()
        const channel = await createChannel(owner.id)
        const post = await createPost(owner.id, channel.id)

        comment = await createComment(owner.id, post.id)
        liker = await createUser()
        likerToken = generateTokens(liker.id, liker.role).accessToken
    })

    beforeEach(async () => {
        await prisma.like.deleteMany()
    })
    
    it('should return 201 and create like', async () => {
        const response = await request(app)
            .post(`/api/comments/${comment.id}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(201)

        const likeInDb = await prisma.like.findFirstOrThrow({
            where: {
                commentId: comment.id,
                ownerId: liker.id
            }
        })

        expect(likeInDb).toBeTruthy()
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('post', '/api/comments/:id/likes', () => likerToken)

    // should return 401 if not authenticated
    expectUnauthorized('post', '/api/comments/:id/likes')

    it('should return 404 if comment not found', async () => {
        const fakeCommentId = comment.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .post(`/api/comments/${fakeCommentId}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(404)

        const likeInDb = await prisma.like.findFirst({
            where: {
                commentId: fakeCommentId,
                ownerId: liker.id
            }
        })

        expect(likeInDb).toBeNull()
    })

    it('should return 409 if like for this comment already exists', async () => {
        await createCommentLike(liker.id, comment.id)

        const response = await request(app)
            .post(`/api/comments/${comment.id}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(409)

        const likesInDb = await prisma.like.findMany({
            where: {
                ownerId: liker.id,
                commentId: comment.id
            }
        })

        expect(Array.isArray(likesInDb)).toBe(true)
        expect(likesInDb).toHaveLength(1)
    })

})

describe('DELETE /api/comments/:id/likes', () => {

    let comment: Comment
    let like: Like
    let liker: User
    let likerToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()
        
        const owner = await createUser()
        const channel = await createChannel(owner.id)
        const post = await createPost(owner.id, channel.id)

        comment = await createComment(owner.id, post.id)
        liker = await createUser()
        likerToken = generateTokens(liker.id, liker.role).accessToken
    })

    beforeEach(async () => {
        await prisma.like.deleteMany()

        like = await createCommentLike(liker.id, comment.id)
    })
    
    it('should return 204 and remove like from db', async () => {
        const response = await request(app)
            .delete(`/api/comments/${comment.id}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(204)

        const likeInDb = await prisma.like.findUnique({ where: { id: like.id } })

        expect(likeInDb).toBeNull()
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('delete', '/api/comments/:id/likes', () => likerToken)

    // should return 401 if not authenticated
    expectUnauthorized('delete', '/api/comments/:id/likes')

    it('should return 404 if like does not exist', async () => {
        const anotherUser = await createUser()
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .delete(`/api/comments/${comment.id}/likes`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(404)
    })

    it('should return 404 if comment not found', async () => {
        const fakeCommentId = comment.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .delete(`/api/comments/${fakeCommentId}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(404)
    })

})