import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const defaultPassword = await bcrypt.hash('lobby123', 12)

  // Create users
  const yoav = await prisma.user.upsert({
    where: { email: 'yoav@jlm-group.com' },
    update: {},
    create: {
      email: 'yoav@jlm-group.com',
      name: 'יואב רוזנבלט',
      passwordHash: defaultPassword,
      role: 'admin',
      title: 'מנהל',
    },
  })

  const gal = await prisma.user.upsert({
    where: { email: 'gal@jlm-group.com' },
    update: {},
    create: {
      email: 'gal@jlm-group.com',
      name: 'גל גולן',
      passwordHash: defaultPassword,
      role: 'lobbyist',
      title: 'שדלן',
    },
  })

  const moshe = await prisma.user.upsert({
    where: { email: 'moshe@jlm-group.com' },
    update: {},
    create: {
      email: 'moshe@jlm-group.com',
      name: 'משה ברדוגו',
      passwordHash: defaultPassword,
      role: 'lobbyist',
      title: 'שדלן',
    },
  })

  const matan = await prisma.user.upsert({
    where: { email: 'matan@jlm-group.com' },
    update: {},
    create: {
      email: 'matan@jlm-group.com',
      name: 'מתן אופנהיימר',
      passwordHash: defaultPassword,
      role: 'lobbyist',
      title: 'שדלן',
    },
  })

  console.log('Seed completed successfully!')
  console.log('Users (all passwords: lobby123):')
  console.log('  yoav@jlm-group.com - יואב רוזנבלט (מנהל)')
  console.log('  gal@jlm-group.com - גל גולן (שדלן)')
  console.log('  moshe@jlm-group.com - משה ברדוגו (שדלן)')
  console.log('  matan@jlm-group.com - מתן אופנהיימר (שדלן)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
