import { Router } from 'express'

import * as CommentsCtrl from '../controllers/comments.controller.js'

import { authMiddleware } from '../middlewares/auth.middleware.js'

import { catchAsync } from '../utils/catchAsync.util.js'

const router = Router()

/**
 * @openapi
 * /api/comments/{id}:
 *   patch:
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     summary: Редактирование комментария
 *     description: Необходимо передать хотя бы одно поле
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID комментария в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: {type: string, example: New comment text}
 *     responses:
 *       200:
 *         description: Комментарий успешно отредактирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/CommentResponse'
 *       400:
 *         description: Ошибка валидации (неверный формат id или недопустимая длина text)
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
 *         description: Доступ запрещен (требуются права автора комментария)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       404:
 *         description: Комментарий с таким id не найден
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
router.patch('/:id', authMiddleware, catchAsync(CommentsCtrl.update))

/**
 * @openapi
 * /api/comments/{id}:
 *   delete:
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     summary: Удаление комментария
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID комментария в формате CUID
 *         schema: {type: string, example: cmnafwa78001x356s21j7i5zr}
 *     responses:
 *       204:
 *         description: Комментарий успешно удален
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
 *         description: Доступ запрещен (требуются права автора комментария или администратора)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ForbiddenErrorResponse'
 *       404:
 *         description: Комментарий с таким id не найден
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
router.delete('/:id', authMiddleware, catchAsync(CommentsCtrl.remove))

/**
 * @openapi
 * /api/comments/{id}/likes:
 *   post:
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     summary: Создание лайка комментария
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID комментария в формате CUID
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
 *         description: Комментарий с таким id не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundErrorResponse'
 *       409:
 *         description: Лайк для этого комментария уже существует
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
router.post('/:id/likes', authMiddleware, catchAsync(CommentsCtrl.createLike))

/**
 * @openapi
 * /api/comments/{id}/likes:
 *   delete:
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     summary: Удаление лайка
 *     parameters:
 *       - in: path
 *         name: id
 *         format: cuid
 *         required: true
 *         description: ID комментария в формате CUID
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
 *         description: Лайк не был поставлен или комментарий с таким id не существует
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
router.delete('/:id/likes', authMiddleware, catchAsync(CommentsCtrl.removeLike))

export default router