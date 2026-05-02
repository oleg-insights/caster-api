import { Router } from 'express'

import usersRoutes from './users.routes.js'
import postsRoutes from './posts.routes.js'
import channelsRoutes from './channels.routes.js'
import commentsRoutes from './comments.routes.js'
import authRoutes from './auth.routes.js'
import adminRoutes from './admin.routes.js'

const router = Router()

router.use('/users', usersRoutes)
router.use('/posts', postsRoutes)
router.use('/channels', channelsRoutes)
router.use('/comments', commentsRoutes)
router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)

export default router