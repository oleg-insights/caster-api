import { Router } from 'express'

import * as PostsCtrl from '../controllers/posts.controller.js'

import { authMiddleware, tryAuth } from '../middlewares/auth.middleware.js'

import { catchAsync } from '../utils/catchAsync.util.js'

const router = Router()

/**
 * @openapi
 * /api/posts:
 *   get:
 *     tags:
 *       - Posts
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     summary: Получение списка постов
 *     description: Публичный доступ. При наличии авторизации возвращает статус лайка текущего пользователя в поле isLikedByMe
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - in: query
 *         name: sortBy
 *         schema: {type: string, enum: [createdAt, title], default: createdAt}
 *       - $ref: '#/components/parameters/Order'
 *     responses:
 *       200:
 *         description: Список постов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/PostListResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат page, limit, sortBy или order)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.get('/', tryAuth, catchAsync(PostsCtrl.getAll))

/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     tags:
 *       - Posts
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     summary: Получение поста по id
 *     description: Публичный доступ. При наличии авторизации возвращает статус лайка текущего пользователя в поле isLikedByMe
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID поста в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       200:
 *         description: Пост успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/PostResponse'
 *       400:
 *         description: Ошибка валидации (id должен быть в формате CUID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       404:
 *         description: Пост с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.get('/:id', tryAuth, catchAsync(PostsCtrl.getById))

/**
 * @openapi
 * /api/posts:
 *   post:
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     summary: Создание поста
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, text, channelId]
 *             properties:
 *               title: {type: string, example: Post title}
 *               text: {type: string, example: Post text about anything}
 *               channelId: {type: string, format: cuid, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       201:
 *         description: Пост успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/PostResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат channelId, либо недопустимая длина title или text)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       401:
 *         description: Требуется авторизация (токен отсутствует или недействителен)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthErrorResponse'
 *       403:
 *         description: Доступ запрещен (требуются права владельца канала)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       404:
 *         description: Канал с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.post('/', authMiddleware, catchAsync(PostsCtrl.create))

/**
 * @openapi
 * /api/posts/{id}:
 *   patch:
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     summary: Редактирование поста
 *     desctiption: Должно быть передано хотя бы одно из полей
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID поста в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: {type: string, example: Changed title}
 *               text: {type: string, example: Changed text about anything}
 *               banner: {type: string, example: https://banner.png}
 *     responses:
 *       200:
 *         description: Пост успешно отредактирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/PostResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат id, недопустимые значения или длина параметров)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       401:
 *         description: Требуется авторизация (токен отсутствует или недействителен)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthErrorResponse'
 *       403:
 *         description: Доступ запрещен (требуются права автора поста или администратора)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       404:
 *         description: Пост с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.patch('/:id', authMiddleware, catchAsync(PostsCtrl.update))

/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     summary: Удаление поста
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID поста в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       204:
 *         description: Пост успешно удален
 *       400:
 *         description: Ошибка валидации (id должен быть в формате CUID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       401:
 *         description: Требуется авторизация (токен отсутствует или недействителен)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthErrorResponse'
 *       403:
 *         description: Доступ запрещен (требуются права автора поста или администратора)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       404:
 *         description: Пост с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.delete('/:id', authMiddleware, catchAsync(PostsCtrl.remove))

/**
 * @openapi
 * /api/posts/{id}/comments:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Получение комментариев поста
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID поста в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - in: query
 *         name: sortBy
 *         schema: {type: string, enum: [createdAt], default: createdAt}
 *       - $ref: '#/components/parameters/Order'
 *     responses:
 *       200:
 *         description: Список комментариев успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/CommentListResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат ID или query-параметров)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       404:
 *         description: Пост с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.get('/:id/comments', catchAsync(PostsCtrl.getComments))

/**
 * @openapi
 * /api/posts/{id}/comments:
 *   post:
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     summary: Создание комментария
 *     description: Автор комментария определяется с помощью токена автоматически
 *     parameters:
 *       - in: path
 *         required: true
 *         name: id
 *         description: ID поста в формате cuid
 *         format: cuid
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: {type: string, example: Comment text}
 *     responses:
 *       201:
 *         description: Комментарий успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/CommentResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат id поста или недопустимая длина text)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       401:
 *         description: Требуется авторизация (токен отсутствует или недействителен)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthErrorResponse'
 *       404:
 *         description: Пост с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.post('/:id/comments', authMiddleware, catchAsync(PostsCtrl.createComment))

/**
 * @openapi
 * /api/posts/{id}/likes:
 *   post:
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     summary: Создание лайка поста
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID поста в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       201:
 *         description: Лайк успешно поставлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/LikeResponse'
 *       400:
 *         description: Ошибка валидации (id должен быть в формате CUID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       401:
 *         description: Требуется авторизация (токен отсутствует или недействителен)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthErrorResponse'
 *       404:
 *         description: Пост с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       409:
 *         description: Лайк для этого поста уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ConflictErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.post('/:id/likes', authMiddleware, catchAsync(PostsCtrl.createLike))

/**
 * @openapi
 * /api/posts/{id}/likes:
 *   delete:
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     summary: Удаление лайка
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID поста в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       204:
 *         description: Лайк успешно удален
 *       400:
 *         description: Ошибка валидации (id должен быть в формате CUID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       401:
 *         description: Требуется авторизация (токен отсутствует или недействителен)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthErrorResponse'
 *       404:
 *         description: Лайк не был поставлен или пост с таким id не существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.delete('/:id/likes', authMiddleware, catchAsync(PostsCtrl.removeLike))

export default router