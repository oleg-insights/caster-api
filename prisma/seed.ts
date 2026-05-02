import bcrypt from 'bcrypt'

import { prisma } from '../src/lib/prisma.js'

const main = async () => {
    console.log('Creating admin...')

    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "secret_password"
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            name: 'admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })

    console.log(`Admin "${admin.name}" created`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (error) => {
        console.error(`Seed Error: ${error}`)
        await prisma.$disconnect()
        process.exit(1)
    })