import { Router } from 'express'

import * as UsersCtrl from '../controllers/users.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js'

import { catchAsync } from '../utils/catchAsync.util.js'

const router = Router()

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Получение своего профиля
 *     responses:
 *       200:
 *         description: Данные профиля успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UserPrivateResponse'
 *       401:
 *         description: Требуется авторизация (токен отсутствует или недействителен)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthErrorResponse'
 *       404:
 *         description: Аккаунт был удален
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
router.get('/me', authMiddleware, catchAsync(UsersCtrl.getMe))

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Получение профиля пользователя
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         description: ID пользователя в формате CUID
 *         required: true
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       200:
 *         description: Данные профиля успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UserPublicResponse'  
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
 *         description: Пользователь с таким id не найден
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
router.get('/:id', authMiddleware, catchAsync(UsersCtrl.getByid))

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Изменение профиля пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: {type: string, example: Max}
 *               email: {type: string, example: user@test.com}
 *               avatar: {type: string, nullable: true, example: https://avatar.jpg}
 *               telegramId: {type: string, nullable: true, example: 1234567890}
 *               telegramNotifications: {type: boolean, example: true}
 *     responses:
 *       200:
 *         description: Профиль успешно изменен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UserPrivateResponse'
 *       400:
 *         description: Ошибка валидации (поля не соответствуют схеме валидации)
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
 *         description: Такой email уже используется
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
router.patch('/me', authMiddleware, catchAsync(UsersCtrl.update))

/**
 * @openapi
 * /api/users/me/password:
 *   patch:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Изменение пароля пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, oldPassword]
 *             properties:
 *               password: {type: string, minLength: 5, maxLength: 50, example: user_password}
 *               oldPassword: {type: string, example: user_password}
 *     responses:
 *       204:
 *         description: Пароль пользователя успешно изменен
 *       400:
 *         description: Ошибка валидации (недопустимая длина password или некорректный oldPassword)
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
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.patch('/me/password', authMiddleware, catchAsync(UsersCtrl.updatePassword))

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Удаление пользователя
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID пользователя в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       204:
 *         description: Пользователь успешно удален
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
 *         description: Доступ запрещен (требуются права владельца аккаунта или администратора)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       404:
 *         description: Пользователь с таким id не найден
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
router.delete('/:id', authMiddleware, catchAsync(UsersCtrl.remove))

/**
 * @openapi
 * /api/users/{id}/comments:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Получение комментариев пользователя
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID пользователя в формате CUID
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
 *         description: Ошибка валидации (неверный формат id или query-параметров)
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
 *         description: Доступ запрещен (требуются права владельца аккаунта или администратора)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       404:
 *         description: Пользователь с таким id не найден
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
router.get('/:id/comments', authMiddleware, catchAsync(UsersCtrl.getComments))

/**
 * @openapi
 * /api/users/me/likes:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Получение лайков текущего пользователя
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - in: query
 *         name: sortBy
 *         schema: {type: string, enum: [createdAt], default: createdAt}
 *       - $ref: '#/components/parameters/Order'
 *     responses:
 *       200:
 *         description: Список лайков успешно получен. Ответ содержит объект поста или комментария
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/LikeListResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат query-параметров)
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
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.get('/me/likes', authMiddleware, catchAsync(UsersCtrl.getLikes))

/**
 * @openapi
 * /api/users/me/subscriptions:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Получение подписок текущего пользователя
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - in: query
 *         name: sortBy
 *         schema: {type: string, enum: [createdAt], default: createdAt}
 *       - $ref: '#/components/parameters/Order'
 *     responses:
 *       200:
 *         description: Список подписок успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/SubscriptionListResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат query-параметров)
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
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.get('/me/subscriptions', authMiddleware, catchAsync(UsersCtrl.getSubscriptions))

/**
 * @openapi
 * /api/users/me/subscriptions:
 *   post:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Создание подписки на канал
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channelId: {type: string, format: cuid, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       201:
 *         description: Подписка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/SubscriptionResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат channelId или попытка подписаться на свой канал)
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
 *         description: Канал с таким channelId не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       409:
 *         description: Подписка на этот канал уже существует
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
router.post('/me/subscriptions', authMiddleware, catchAsync(UsersCtrl.subscribeToChannel))

/**
 * @openapi
 * /api/users/me/subscriptions/{channelId}:
 *   delete:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Удаление подписки на канал
 *     parameters:
 *       - in: path
 *         name: channelId
 *         format: cuid
 *         required: true
 *         description: ID канала в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       204:
 *         description: Подписка успешно удалена
 *       400:
 *         description: Ошибка валидации (channelId должен быть в формате CUID)
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
 *         description: Подписка не была создана или канал с таким channelId не существует
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
router.delete('/me/subscriptions/:channelId', authMiddleware, catchAsync(UsersCtrl.removeSubscribe))

export default router