import './config/env.config.js'
import express from 'express'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'

import { swaggerSpec } from './config/swagger.config.js'
import apiRouter from './routes/index.js'

import { errorHandler } from './middlewares/error.middleware.js'

import type { Request, Response } from 'express'

export const app = express()

app.use(express.json())

if (process.env.ENABLE_SWAGGER === "true") {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

app.use(cookieParser())

app.use('/api', apiRouter)

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        status: 404,
        code: 'NOT_FOUND',
        message: `Route '${req.originalUrl}' not found`
    })
})

app.use(errorHandler)