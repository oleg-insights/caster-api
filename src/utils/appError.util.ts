const errorCodeList: Record<number, string> = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'ALREADY_EXISTS',
    500: 'INTERNAL_SERVER_ERROR'
}

export class AppError extends Error {
    public statusCode: number
    public code: string

    constructor(statusCode: number, message: string) {
        super(message)
        this.statusCode = statusCode
        this.code = errorCodeList[statusCode] || 'INTERNAL_SERVER_ERROR'

        Error.captureStackTrace(this, this.constructor)
    }
}