import request from 'supertest'
import { describe, it, expect, beforeEach, beforeAll } from 'vitest'

import { app } from '../../src/app.js'
import { prisma } from '../../src/lib/prisma.js'

import { generateTokens } from '../../src/utils/jwt.util.js'

import { 
    createPost, 
    createChannel, 
    createUser,
    createComment,
    createPostLike
} from '../helpers/factories.js'
import { expectInvalidCuid, expectInvalidPagination } from '../helpers/validation.helper.js'
import { expectUnauthorized } from '../helpers/auth.helper.js'
import { randomString } from '../helpers/randomString.js'

import type { User, Channel, Post, Comment, Like } from '@prisma/client'
import type { IMeta } from '../../src/types/meta.js'

describe('GET /api/posts', () => {

    let owner: User
    let channel: Channel
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        channel = await createChannel(owner.id)
    })

    beforeEach(async () => {
        await prisma.post.deleteMany()
    })
    
    it('should return 200 and list of posts based on pagination', async () => {
        await Promise.all(
            Array.from({length: 5}).map(() => createPost(owner.id, channel.id))
        )
        
        const response = await request(app)
            .get('/api/posts')
            .query({page: 2, limit: 2, sortBy: 'title', order: 'desc'})

        expect(response.status).toBe(200)

        const posts = response.body.data?.posts

        expect(Array.isArray(posts)).toBe(true)
        expect(posts).toHaveLength(2)
        expect(posts[0]).not.toHaveProperty('ownerId')
        expect(posts[0].owner).toMatchObject({
            id: owner.id,
            name: owner.name,
            avatar: owner.avatar
        })
        expect(posts[0].title >= posts[1].title).toBe(true)

        const meta: IMeta = response.body.data?.meta

        expect(meta.totalItems).toBe(5)
        expect(meta.totalPages).toBe(3)
        expect(meta.currentPage).toBe(2)
        expect(meta.limit).toBe(2)
    })

    it('should return isLikedByMe: true if user liked post', async () => {
        const liker = await createUser()
        const likerAccessToken = generateTokens(liker.id, liker.role).accessToken
        const post = await createPost(owner.id, channel.id)
        
        await createPostLike(liker.id, post.id)

        const response = await request(app)
            .get('/api/posts')
            .set('Authorization', `Bearer ${likerAccessToken}`)

        expect(response.status).toBe(200)

        const posts = response.body.data?.posts
        
        expect(posts[0].isLikedByMe).toBe(true)
    })

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/posts', () => null)

})

describe('GET /api/posts/:id', () => {

    let owner: User
    let channel: Channel
    let post: Post

    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        channel = await createChannel(owner.id)
        post = await createPost(owner.id, channel.id)
    })

    it('should return 200 and post data', async () => {
        const response = await request(app)
            .get(`/api/posts/${post.id}`)

        expect(response.status).toBe(200)

        const foundPost = response.body.data?.post
        
        expect(foundPost).toBeTruthy()
        expect(foundPost).not.toHaveProperty('ownerId')
        expect(foundPost).toMatchObject({
            title: post.title,
            text: post.text,
            owner: {
                id: owner.id,
                name: owner.name,
                avatar: owner.avatar
            }
        })
    })

    it('should return isLikedByMe: true if user liked post', async () => {
        const liker = await createUser()
        const likerAccessToken = generateTokens(liker.id, liker.role).accessToken
        const post = await createPost(owner.id, channel.id)
        
        await createPostLike(liker.id, post.id)

        const response = await request(app)
            .get(`/api/posts/${post.id}`)
            .set('Authorization', `Bearer ${likerAccessToken}`)

        expect(response.status).toBe(200)

        const foundPost = response.body.data?.post
        
        expect(foundPost.isLikedByMe).toBe(true)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('get', '/api/posts/:id', () => null)

    it('should return 404 if post not found', async () => {
        const fakePostId = post.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .get(`/api/posts/${fakePostId}`)

        expect(response.status).toBe(404)
    })

})

describe('POST /api/posts', () => {

    const validPostData = {
        title: `title_${randomString(10)}`,
        text: `text_${randomString(10)}`
    }

    const invalidItems = [
        { payload: { title: 5 }, reason: 'title is not a string' },
        { payload: { text: 't' }, reason: 'text is too short' }
    ]
    
    let owner: User
    let ownerToken: string
    let channel: Channel
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        ownerToken = generateTokens(owner.id, owner.role).accessToken
        channel = await createChannel(owner.id)
    })

    beforeEach(async () => {
        await prisma.post.deleteMany()
    })

    it('should return 201 and create post', async () => {
        const postData = {
            channelId: channel.id,
            title: 'new_title',
            text: 'new_text'
        }

        const response = await request(app)
            .post('/api/posts')
            .send(postData)
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(201)

        const post = response.body.data?.post

        expect(post).toBeTruthy()
        expect(post).toMatchObject({
            channelId: postData.channelId,
            title: postData.title,
            text: postData.text,
            owner: {
                id: owner.id,
                name: owner.name,
                avatar: owner.avatar
            }
        })
        
        const postInDb = await prisma.post.findUnique({ where: { id: post.id } })

        expect(postInDb).toBeTruthy()
    })

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .post('/api/posts')
                .send({ channelId: channel.id, ...validPostData, ...item.payload })
                .set('Authorization', `Bearer ${ownerToken}`)

            expect(response.status).toBe(400)
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('post', '/api/posts')

    it('should return 403 if authenticated but not an channel owner', async () => {
        const anotherUser = await createUser()
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .post('/api/posts')
            .send({ channelId: channel.id, ...validPostData })
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)
    })

    it('should return 404 if channel not found', async () => {
        const fakeChannelId = channel.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .post('/api/posts')
            .send({ channelId: fakeChannelId, ...validPostData })
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(404)

        const postInDb = await prisma.post.findFirst({
            where: validPostData
        })

        expect(postInDb).toBeNull()
    })

})

describe('PATCH /api/posts/:id', () => {

    const validPatchData = {
        title: 'valid_title',
        text: 'valid_text',
        banner: 'https://valid_banner.png'
    }

    const invalidItems = [
        { payload: { title: 125 }, reason: 'title is not a string' },
        { payload: { text: 't' }, reason: 'text is too short' },
        { payload: { banner: 'https://img.exe' }, reason: 'banner format is invalid' }
    ]
    
    let owner: User
    let ownerToken: string
    let channel: Channel
    let post: Post
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        ownerToken = generateTokens(owner.id, owner.role).accessToken
        channel = await createChannel(owner.id)
    })

    beforeEach(async () => {
        await prisma.post.deleteMany()
        
        post = await createPost(owner.id, channel.id, {
            title: 'original_title', 
            text: 'original_text'
        })
    })
    
    it('should return 200 and change provided fields', async () => {
        const response = await request(app)
            .patch(`/api/posts/${post.id}`)
            .send({title: 'changed_title'})
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(200)

        const updatedPost: Post = response.body.data?.post

        expect(updatedPost).toBeTruthy()

        const postInDb = await prisma.post.findUnique({ where: { id: updatedPost.id } })

        expect(postInDb).toBeTruthy()
        expect(postInDb).toMatchObject({
            title: 'changed_title',
            text: 'original_text'
        })
    })

    it('should return isLikedByMe: true if user liked post', async () => {
        await createPostLike(owner.id, post.id)

        const response = await request(app)
            .patch(`/api/posts/${post.id}`)
            .send({title: 'changed_title'})
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(200)

        const foundPost = response.body.data?.post
        
        expect(foundPost.isLikedByMe).toBe(true)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('patch', '/api/posts/:id', () => ownerToken)

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .patch(`/api/posts/${post.id}`)
                .send({ ...validPatchData, ...item.payload })
                .set('Authorization', `Bearer ${ownerToken}`)

            expect(response.status).toBe(400)
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('patch', '/api/posts/:id')

    it('should return 403 if authenticated but not an admin or author', async () => {
        const anotherUser = await createUser({ role: 'USER' })
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .patch(`/api/posts/${post.id}`)
            .send(validPatchData)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)

        const postInDb = await prisma.post.findFirst({ where: { id: post.id } })

        expect(postInDb).toBeTruthy()
        expect(postInDb?.title).not.toBe(validPatchData.title)
    })

    it('should return 404 if post not found', async () => {
        const fakePostId = post.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .patch(`/api/posts/${fakePostId}`)
            .send(validPatchData)
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(404)
    })

})

describe('DELETE /api/posts/:id', () => {

    let owner: User
    let ownerToken: string
    let channel: Channel
    let post: Post
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        owner = await createUser()
        ownerToken = generateTokens(owner.id, owner.role).accessToken
        channel = await createChannel(owner.id)
    })

    beforeEach(async () => {
        await prisma.post.deleteMany()

        post = await createPost(owner.id, channel.id)
    })
    
    it('should return 204 and remove post from db', async () => {
        const response = await request(app)
            .delete(`/api/posts/${post.id}`)
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(204)

        const postInDb = await prisma.post.findUnique({ where: { id: post.id } })

        expect(postInDb).toBeNull()
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('delete', '/api/posts/:id', () => ownerToken)

    // should return 401 if not authenticated
    expectUnauthorized('delete', '/api/posts/:id')

    it('should return 403 if authenticated but not an admin or author', async () => {
        const anotherUser = await createUser({ role: 'USER' })
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .delete(`/api/posts/${post.id}`)
            .set('Authorization', `Bearer ${anotherUserToken}`)

        expect(response.status).toBe(403)

        const postInDb = await prisma.post.findUnique({ where: { id: post.id } })

        expect(postInDb).toBeTruthy()
    })

    it('should return 404 if post not found', async () => {
        await prisma.post.deleteMany()

        const response = await request(app)
            .delete(`/api/posts/${post.id}`)
            .set('Authorization', `Bearer ${ownerToken}`)

        expect(response.status).toBe(404)
    })

})

describe('GET /api/posts/:id/comments', () => {

    let post: Post
    
    beforeAll(async () => {
        await prisma.user.deleteMany()
        
        const owner = await createUser()
        const channel = await createChannel(owner.id)
        post = await createPost(owner.id, channel.id)
    })
    
    it('should return 200 and list of comments based on pagination', async () => {
        const commentators = await Promise.all(
            Array.from({length: 5}).map(() => createUser())
        )
        
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        for (const commentator of commentators) {
            await createComment(commentator.id, post.id)
            await sleep(10)
        }

        const response = await request(app)
            .get(`/api/posts/${post.id}/comments`)
            .query({page: 2, limit: 2, sortBy: 'createdAt', order: 'desc'})

        expect(response.status).toBe(200)

        const comments: Comment[] = response.body.data?.comments

        expect(Array.isArray(comments)).toBe(true)
        expect(comments).toHaveLength(2)
        
        const date_1 = new Date(comments[0].createdAt).getTime()
        const date_2 = new Date(comments[1].createdAt).getTime()

        expect(date_1).toBeGreaterThanOrEqual(date_2)

        const meta: IMeta = response.body.data?.meta

        expect(meta.totalItems).toBe(5)
        expect(meta.totalPages).toBe(3)
        expect(meta.currentPage).toBe(2)
        expect(meta.limit).toBe(2)
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('get', '/api/posts/:id/comments', () => null)

    // should return 400 if query params are invalid
    expectInvalidPagination('get', '/api/posts/:id/comments', () => null)

    it('should return 404 if post not found', async () => {
        const fakePostId = post.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .get(`/api/posts/${fakePostId}/comments`)
            .query({page: 2, limit: 2, sortBy: 'createdAt', order: 'desc'})

        expect(response.status).toBe(404)
        expect(response.body).not.toHaveProperty('data')
    })

})

describe('POST /api/posts/:id/comments', () => {

    const validCommentData = {
        text: 'valid_text'
    }

    const invalidItems = [
        { payload: { text: 't' }, reason: 'text is too short' }
    ]
    
    let post: Post
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
    })

    it('should return 201 and create comment', async () => {
        const testCommentData = { text: 'new_comment' }
        
        const response = await request(app)
            .post(`/api/posts/${post.id}/comments`)
            .send(testCommentData)
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(201)

        const commentsInDb = await prisma.comment.findMany({
            where: { 
                authorId: commentator.id,
                postId: post.id
            }
        })

        expect(Array.isArray(commentsInDb)).toBe(true)
        expect(commentsInDb).toHaveLength(1)
        expect(commentsInDb[0]).toMatchObject({
            text: testCommentData.text
        })
    })

    // should return 400 if request data is invalid
    invalidItems.forEach(item => {
        it(`should return 400 if ${item.reason}`, async () => {
            const response = await request(app)
                .post(`/api/posts/${post.id}/comments`)
                .send({ ...validCommentData, ...item.payload })
                .set('Authorization', `Bearer ${commentatorToken}`)

            expect(response.status).toBe(400)

            const commentInDb = await prisma.comment.findFirst({ where: item.payload })

            expect(commentInDb).toBeNull()
        })
    })

    // should return 401 if not authenticated
    expectUnauthorized('post', '/api/posts/:id/comments')

    it('should return 404 if post not found', async () => {
        const fakePostId = post.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .post(`/api/posts/${fakePostId}/comments`)
            .send(validCommentData )
            .set('Authorization', `Bearer ${commentatorToken}`)

        expect(response.status).toBe(404)

        const commentInDb = await prisma.comment.findFirst({ where: validCommentData })

        expect(commentInDb).toBeNull()
    })

})

describe('POST /api/posts/:id/likes', () => {

    let post: Post
    let liker: User
    let likerToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        const owner = await createUser()
        const channel = await createChannel(owner.id)

        post = await createPost(owner.id, channel.id)
        liker = await createUser()
        likerToken = generateTokens(liker.id, liker.role).accessToken
    })

    beforeEach(async () => {
        await prisma.like.deleteMany() 
    })
    
    it('should return 201 and create like', async () => {
        const response = await request(app)
            .post(`/api/posts/${post.id}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(201)

        const like: Like = response.body.data?.like

        expect(like).toBeTruthy()

        const likeInDb = await prisma.like.findFirst({
            where: {
                ownerId: liker.id,
                postId: post.id
            }
        })

        expect(likeInDb).toBeTruthy()
    })
    
    // should return 400 if id format is not cuid
    expectInvalidCuid('post', '/api/posts/:id/likes', () => likerToken)

    // should return 401 if not authenticated
    expectUnauthorized('post', '/api/posts/:id/likes')

    it('should return 404 if post not found', async () => {
        const fakePostId = post.id.slice(0, -4) + 'fake'
        
        const response = await request(app)
            .post(`/api/posts/${fakePostId}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(404)

        const likeInDb = await prisma.like.findFirst({
            where: { postId: fakePostId }
        })

        expect(likeInDb).toBeNull()
    })

    it('should return 409 if post already liked by user', async () => {
        await createPostLike(liker.id, post.id)

        const response = await request(app)
            .post(`/api/posts/${post.id}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(409)

        const likesInDb = await prisma.like.findMany({
            where: {
                ownerId: liker.id,
                postId: post.id
            }
        })

        expect(Array.isArray(likesInDb)).toBe(true)
        expect(likesInDb).toHaveLength(1)
    })

})

describe('DELETE /api/posts/:id/likes', () => {

    let post: Post
    let like: Like
    let liker: User
    let likerToken: string
    
    beforeAll(async () => {
        await prisma.user.deleteMany()

        const owner = await createUser()
        const channel = await createChannel(owner.id)
        
        post = await createPost(owner.id, channel.id)
        liker = await createUser()
        likerToken = generateTokens(liker.id, liker.role).accessToken
    })

    beforeEach(async () => {
        await prisma.like.deleteMany()

        like = await createPostLike(liker.id, post.id)
    })
    
    it('should return 204 and remove like from db', async () => {
        const response = await request(app)
            .delete(`/api/posts/${post.id}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(204)

        const likeInDb = await prisma.like.findUnique({ where: { id: like.id } })

        expect(likeInDb).toBeNull()
    })

    // should return 400 if id format is not cuid
    expectInvalidCuid('delete', '/api/posts/:id/likes', () => likerToken)

    // should return 401 if not authenticated
    expectUnauthorized('delete', '/api/posts/:id/likes')

    it('should return 404 if like does not exist', async () => {
        const anotherUser = await createUser()
        const anotherUserToken = generateTokens(anotherUser.id, anotherUser.role).accessToken

        const response = await request(app)
            .delete(`/api/posts/${post.id}/likes`)
            .set('Authorization', `Bearer ${anotherUserToken}`)
        
        expect(response.status).toBe(404)
    })

    it('should return 404 if post not found', async () => {
        const fakePostId = post.id.slice(0, -4) + 'fake'

        const response = await request(app)
            .delete(`/api/posts/${fakePostId}/likes`)
            .set('Authorization', `Bearer ${likerToken}`)

        expect(response.status).toBe(404)
    })

})