import { Router } from 'express'

import * as AuthCtrl from '../controllers/auth.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js'

import { catchAsync } from '../utils/catchAsync.util.js'

const router = Router()

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Регистрация нового пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: {type: string, example: user@test.com}
 *               name: {type: string, minLength: 3, maxLength: 20, example: Max}
 *               password: {type: string, minLength: 8, maxLength: 50, example: user_password}
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthRegisterResponse'
 *       400:
 *         description: Ошибка валидации (Неверный формат email, либо недопустимая длина name или password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
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
router.post('/register', catchAsync(AuthCtrl.register))

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Вход в аккаунт по email и паролю
 *     description: Генерирует токены при успешном входе
 *     requestBody:
 *       required: true
 *       content: 
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: {type: string, example: user@test.com}
 *               password: {type: string, example: user_password}
 *     responses:
 *       200:
 *         description: Вход в аккаунт выполнен успешно. Устанавливается httpOnly кука refreshToken
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=xyz123...; HttpOnly; Secure; SameSite=strict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthLoginResponse'
 *       400:
 *         description: Ошибка валидации (Неверный формат email)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ValidationErrorResponse'
 *       401:
 *         description: Указан неверный email или пароль
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
router.post('/login', catchAsync(AuthCtrl.login))

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Обновление access- и refresh- токенов
 *     description: Ожидает старый refreshToken в куках запроса. Записывает новый refreshToken в куки httpOnly
 *     responses:
 *       201:
 *         description: Токены успешно сгенерированы
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=xyz123; HttpOnly; Secure; SameSite=strict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/AuthRefreshResponse'
 *       401:
 *         description: Сессия истекла, либо refreshToken не передан или невалиден. Кука refreshToken будет удалена
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
router.post('/refresh', catchAsync(AuthCtrl.refresh))

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     summary: Выход из аккаунта
 *     description: Заносит accessToken пользователя в blacklist в Redis, удаляет refreshToken из БД, чистит куки
 *     responses:
 *       204:
 *         description: Выход из аккаунта выполнен успешно
 *       401:
 *         description: Токен отсутствует или недействителен
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
router.post('/logout', authMiddleware, catchAsync(AuthCtrl.logout))

export default router