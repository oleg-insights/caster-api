import { Router } from 'express'

import * as ChannelsCtrl from '../controllers/channels.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js'

import { catchAsync } from '../utils/catchAsync.util.js'

const router = Router()

/**
 * @openapi
 * /api/channels:
 *   get:
 *     tags:
 *       - Channels
 *     summary: Получение списка каналов
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - in: query
 *         name: sortBy
 *         schema: {type: string, enum: [createdAt, title], default: createdAt}
 *       - $ref: '#/components/parameters/Order'
 *     responses:
 *       200:
 *         description: Список каналов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ChannelListResponse'
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
router.get('/', catchAsync(ChannelsCtrl.getAll))

/**
 * @openapi
 * /api/channels/{id}:
 *   get:
 *     tags:
 *       - Channels
 *     summary: Получение данных канала по id
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID канала в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       200:
 *         description: Данные канала успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ChannelResponse'
 *       400:
 *         description: Ошибка валидации (id должен быть в формате CUID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
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
router.get('/:id', catchAsync(ChannelsCtrl.getOneById))

/**
 * @openapi
 * /api/channels:
 *   post:
 *     tags:
 *       - Channels
 *     security:
 *       - bearerAuth: []
 *     summary: Создание канала
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: {type: string, minLength: 3, maxLength: 30, example: My channel}
 *     responses:
 *       201:
 *         description: Канал успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ChannelResponse'
 *       400:
 *         description: Ошибка валидации (title обязателен и должен быть от 3 до 30 символов)
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
 *       409:
 *         description: Такое название канала уже используется
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
router.post('/', authMiddleware, catchAsync(ChannelsCtrl.create))

/**
 * @openapi
 * /api/channels/{id}:
 *   patch:
 *     tags:
 *       - Channels
 *     security:
 *       - bearerAuth: []
 *     summary: Редактирование канала
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID канала в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: {type: string, example: My new channel title}
 *               description: {type: string, example: Description of my channel}
 *               avatar: {type: string, example: https://avatar.png}
 *               banner: {type: string, example: https://banner.png}
 *     responses:
 *       200:
 *         description: Канал успешно отредактирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ChannelResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат id или невалидные параметры)
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
 *         description: Доступ запрещен (требуются права владельца канала или администратора)
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
 *       409:
 *         description: Такое название канала уже используется
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
router.patch('/:id', authMiddleware, catchAsync(ChannelsCtrl.update))

/**
 * @openapi
 * /api/channels/{id}:
 *   delete:
 *     tags:
 *       - Channels
 *     security:
 *       - bearerAuth: []
 *     summary: Удаление канала
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID канала в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       204:
 *         description: Канал успешно удален
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
 *         description: Доступ запрещен (требуются права владельца канала или администратора)
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
router.delete('/:id', authMiddleware, catchAsync(ChannelsCtrl.remove))

/**
 * @openapi
 * /api/channels/{id}/subscribers:
 *   get:
 *     tags:
 *       - Channels
 *     security:
 *       - bearerAuth: []
 *     summary: Получение подписчиков канала
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID канала в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - in: query
 *         name: sortBy
 *         schema: {type: string, enum: [createdAt, name], default: createdAt}
 *       - $ref: '#/components/parameters/Order'
 *     responses:
 *       200:
 *         description: Список подписчиков успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UserPublicListResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат id или невалидные параметры пагинации)
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
router.get('/:id/subscribers', authMiddleware, catchAsync(ChannelsCtrl.getSubscribers))

export default router