import { Router } from 'express'

import * as AdminCtrl from '../controllers/admin.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js'
import { restrictTo } from '../middlewares/restrictTo.js'

import { catchAsync } from '../utils/catchAsync.util.js'

const router = Router()

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     summary: Получение списка пользователей
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - in: query
 *         name: sortBy
 *         schema: {type: string, enum: [createdAt, name, role, email], default: createdAt}
 *       - $ref: '#/components/parameters/Order'
 *     responses:
 *       200:
 *         description: Список пользователей успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UserPrivateListResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат page, limit, sortBy или order)
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
 *         description: Доступ запрещен (требуются права администратора)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/InternalServerErrorResponse'
 */
router.get('/users', authMiddleware, restrictTo('ADMIN'), catchAsync(AdminCtrl.getUsers))

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     summary: Изменение роли пользователя
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID пользователя в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum:
 *                   - ADMIN
 *                   - USER
 *     responses:
 *       200:
 *         description: Роль успешно изменена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UserPrivateResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат id или некорректная роль)
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
 *         description: Доступ запрещен (требуются права администратора)
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
router.patch('/users/:id/role', authMiddleware, restrictTo('ADMIN'), catchAsync(AdminCtrl.changeRole))

export default router