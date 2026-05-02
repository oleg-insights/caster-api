import swaggerJsdoc from 'swagger-jsdoc'

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { 
            title: 'Caster API', 
            version: '1.0', 
            description: 'API для управления контентом' 
        },
        tags: [
            { name: 'Admin', description: 'Операции, доступные только админам' }, 
            { name: 'Auth', description: 'Операции для аутентификации' }, 
            { name: 'Channels', description: 'Управление каналами' }, 
            { name: 'Comments', description: 'Управление комментариями' }, 
            { name: 'Posts', description: 'Управление постами' }, 
            { name: 'Users', description: 'Управление пользователями' } 
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http', scheme: 'bearer', format: 'JWT'
                }
            },
            schemas: {
                Channel: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        title: {type: 'string', example: 'My channel'},
                        description: {type: 'string', example: 'It\'s my new channel'},
                        avatar: {type: 'string', example: 'https://avatar.jpg'},
                        banner: {type: 'string', example: 'https://banner.jpg'},
                        ownerId: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'}
                    }
                },
                ChannelShort: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        title: {type: 'string', example: 'My channel'},
                        avatar: {type: 'string', example: 'https://avatar.jpg'},
                        createdAt: {type: 'string', format: 'date-time'},
                        owner: {
                            type: 'object',
                            properties: {
                                id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                                name: {type: 'string', example: 'Имя владельца поста'},
                                avatar: {type: 'string', example: 'https://avatar.png'}
                            }
                        }
                    }
                },
                Comment: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        text: {type: 'string', example: 'Text of comment'},
                        authorId: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        postId: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'},
                        author: {
                            type: 'object',
                            properties: {
                                id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                                name: {type: 'string', example: 'Имя владельца поста'},
                                avatar: {type: 'string', example: 'https://avatar.png'}
                            }
                        },
                        _count: {
                            type: 'object',
                            properties: {
                                likes: {
                                    type: 'integer', 
                                    description: 'Количество лайков',
                                    example: 10
                                }
                            }
                        },
                        isLikedByMe: {type: 'boolean', example: true}
                    }
                },
                CommentShort: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        text: {type: 'string', example: 'Text of comment'},
                        createdAt: {type: 'string', format: 'date-time'},
                        author: {
                            type: 'object',
                            properties: {
                                id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                                name: {type: 'string', example: 'Имя владельца поста'},
                                avatar: {type: 'string', example: 'https://avatar.png'}
                            }
                        },
                        _count: {
                            type: 'object',
                            properties: {
                                likes: {
                                    type: 'integer', 
                                    description: 'Количество лайков',
                                    example: 10
                                }
                            }
                        },
                        isLikedByMe: {type: 'boolean', example: true}
                    }
                },
                Like: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        type: {type: 'string', example: 'post'},
                        createdAt: {type: 'string', format: 'date-time'},
                        item: {
                            oneOf: [
                                {$ref: '#/components/schemas/PostShort'},
                                {$ref: '#/components/schemas/CommentShort'}
                            ]
                        }
                    }
                },
                Post: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        title: {type: 'string', example: 'My post'},
                        text: {type: 'string', example: 'My post body'},
                        banner: {type: 'string', example: 'https://banner.jpg'},
                        channelId: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        createdAt: {type: 'string', format: 'date-time'},
                        updatedAt: {type: 'string', format: 'date-time'},
                        owner: {
                            type: 'object',
                            properties: {
                                id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                                name: {type: 'string', example: 'Имя владельца поста'},
                                avatar: {type: 'string', example: 'https://avatar.png'}
                            }
                        },
                        _count: {
                            type: 'object',
                            properties: {
                                likes: {
                                    type: 'integer', 
                                    description: 'Количество лайков',
                                    example: 10
                                }
                            }
                        },
                        isLikedByMe: {type: 'boolean', example: true}
                    }
                },
                PostShort: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        title: {type: 'string', example: 'My post'},
                        createdAt: {type: 'string', format: 'date-time'},
                        owner: {
                            type: 'object',
                            properties: {
                                id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                                name: {type: 'string', example: 'Имя владельца поста'},
                                avatar: {type: 'string', example: 'https://avatar.png'}
                            }
                        },
                        _count: {
                            type: 'object',
                            properties: {
                                likes: {
                                    type: 'integer', 
                                    description: 'Количество лайков',
                                    example: 10
                                }
                            }
                        },
                        isLikedByMe: {type: 'boolean', example: true}
                    }
                },
                Subscription: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        subscriberId: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        createdAt: {type: 'string', format: 'date-time'},
                        channel: {$ref: '#/components/schemas/ChannelShort'}
                    }
                },
                UserPublic: {
                    type: 'object',
                    properties: {
                        id: {type: 'string', example: 'cmnafwa76001x356s21j7i5zg'},
                        name: {type: 'string', example: 'username'},
                        role: {type: 'string', example: 'USER'},
                        avatar: {type: 'string', example: 'https://avatar.jpg'},
                        createdAt: {type: 'string', format: 'date-time'}
                    }
                },
                UserPrivate: {
                    allOf: [
                        { $ref: '#/components/schemas/UserPublic' },
                        {
                            type: 'object',
                            properties: {
                                email: {type: 'string', example: 'user@test.com'},
                                telegramId: {type: 'string', example: '1234567890'},
                                telegramNotifications: {type: 'boolean', example: true},
                                updatedAt: {type: 'string', format: 'date-time'}
                            }
                        }
                    ]
                },
                Meta: {
                    type: 'object',
                    properties: {
                        totalItems: {type: 'integer', example: 100},
                        totalPages: {type: 'integer', example: 10},
                        currentPage: {type: 'integer', example: 1},
                        limit: {type: 'integer', example: 10}
                    }
                },
                ZodIssue: {
                    type: 'object',
                    properties: {
                        path: {type: 'string', example: 'email'},
                        message: {type: 'string', example: 'required'}
                    },

                }
            },
            responses: {
                AuthErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: false},
                        status: {example: 401},
                        code: {example: 'UNAUTHORIZED'},
                        message: {example: 'Token is invalid'}
                    }
                },
                ConflictErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: false},
                        status: {example: 409},
                        code: {example: 'ALREADY_EXISTS'},
                        message: {example: 'Email already in use'}
                    }
                },
                ForbiddenErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: false},
                        status: {example: 403},
                        code: {example: 'FORBIDDEN'},
                        message: {example: 'Do not have permissions'}
                    }
                },
                InternalServerErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: false},
                        status: {example: 500},
                        code: {example: 'INTERNAL_SERVER_ERROR'},
                        message: {example: 'Internal Server Error'}
                    }
                },
                NotFoundErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: false},
                        status: {example: 404},
                        code: {example: 'NOT_FOUND'},
                        message: {example: 'Resource not found'}
                    }
                },
                ValidationErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: false},
                        status: {example: 400},
                        code: {example: 'VALIDATION_ERROR'},
                        message: {example: 'Email is required'},
                        errors: {
                            type: 'array',
                            items: {$ref: '#/components/schemas/ZodIssue'}
                        }
                    }
                },
                AuthLoginResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                user: {$ref: '#/components/schemas/UserPrivate'},
                                accessToken: {type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbzkxcjMwaTAwMDA3d3U1aXVqd3BqY2QiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc3NjgwMTk0OSwiZXhtINzc2ODg4MzQ5fQ.tj8__fQ07gMi3ZDY8TISZafcDh7CXY0uHxffZFnoY1w'}
                            } 
                        }
                    }
                },
                AuthRefreshResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                accessToken: {type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbzkxcjMwaTAwMDA3d3U1aXVqd3BqY2QiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc3NjgwMTk0OSwiZXhtINzc2ODg4MzQ5fQ.tj8__fQ07gMi3ZDY8TISZafcDh7CXY0uHxffZFnoY1w'}
                            }
                        }
                    }
                },
                AuthRegisterResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/UserPrivate' }
                            }
                        }
                    }
                },
                ChannelListResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                channels: {
                                    type: 'array', 
                                    items: {$ref: '#/components/schemas/Channel'}
                                },
                                meta: {$ref: '#/components/schemas/Meta'}
                            }
                        }
                    }
                },
                ChannelResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                channel: { $ref: '#components/schemas/Channel' }
                            }
                        }
                    }
                },
                CommentListResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                comments: {
                                    type: 'array',
                                    items: {$ref: '#/components/schemas/Comment'}
                                },
                                meta: {$ref: '#/components/schemas/Meta'}
                            }
                        }
                    }
                },
                CommentResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                comment: {$ref: '#/components/schemas/Comment'}
                            }
                        }
                    }
                },
                LikeListResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                likes: {
                                    type: 'array',
                                    items: {$ref: '#/components/schemas/Like'}
                                },
                                meta: {$ref: '#/components/schemas/Meta'}
                            }
                        }
                    }
                },
                LikeResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                like: {$ref: '#/components/schemas/Like'}
                            }
                        }
                    }
                },
                PostListResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                posts: { 
                                    type: 'array', 
                                    items: {$ref: '#/components/schemas/Post'} 
                                },
                                meta: {$ref: '#/components/schemas/Meta'}
                            }
                        }
                    }
                },
                PostResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                post: {$ref: '#/components/schemas/Post'}
                            }
                        }
                    }
                },
                SubscriptionListResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                subscriptions: {
                                    type: 'array',
                                    items: {$ref: '#/components/schemas/Subscription'}
                                },
                                meta: {$ref: '#/components/schemas/Meta'}
                            }
                        }
                    }
                },
                SubscriptionResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: {
                                sub: {$ref: '#/components/schemas/Subscription'}
                            }
                        }
                    }
                },
                UserPublicListResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: { 
                                users: { 
                                    type: 'array', 
                                    items: {$ref: '#/components/schemas/UserPublic'} 
                                },
                                meta: {$ref: '#/components/schemas/Meta'}
                            }
                        }
                    }
                },
                UserPrivateListResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: { 
                                users: { 
                                    type: 'array', 
                                    items: {$ref: '#/components/schemas/UserPrivate'} 
                                },
                                meta: {$ref: '#/components/schemas/Meta'} 
                            }
                        }
                    }
                },
                UserPublicResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: { 
                                user: {$ref: '#/components/schemas/UserPublic'}
                            }
                        }
                    }
                },
                UserPrivateResponse: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        data: {
                            type: 'object',
                            properties: { 
                                user: {$ref: '#/components/schemas/UserPrivate'}
                            }
                        }
                    }
                }
            },
            parameters: {
                Page: {
                    in: 'query',
                    name: 'page',
                    schema: {type: 'integer', minimum: 1, default: 1},
                    description: 'Порядковый номер страницы'
                },
                Limit: {
                    in: 'query',
                    name: 'limit',
                    schema: {type: 'integer', minimum: 1, maximum: 100, default: 10},
                    description: 'Количество записей на страницу'
                },
                Order: {
                    in: 'query',
                    name: 'order',
                    schema: {type: 'string', enum: ['asc', 'desc'], default: 'desc'},
                    description: 'Направление сортировки: asc (по возрастанию), desc (по убыванию)'
                }
            }
        },
        servers: [
            { 
                url: 'http://localhost:3000', 
                description: 'Локальный сервер разработки' 
            }
        ]
    },
    apis: [
        "./src/routes/**/*.ts", 
        "./src/routes/**/*.js",
        "./src/app.ts",
        "./src/app.js"
    ]
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)