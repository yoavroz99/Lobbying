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

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      name: 'איגוד התעשיינים',
      industry: 'תעשייה',
      contactName: 'רון ישראלי',
      contactEmail: 'ron@manufacturers.co.il',
      description: 'איגוד התעשיינים בישראל - ייצוג אינטרסים של המגזר התעשייתי',
      keywords: 'תעשייה,ייצור,מפעלים,תעסוקה,יצוא',
      users: {
        create: [
          { userId: yoav.id, role: 'lead' },
          { userId: gal.id, role: 'member' },
        ],
      },
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'חברת אנרגיה ירוקה בע"מ',
      industry: 'אנרגיה',
      contactName: 'מיכל גרין',
      contactEmail: 'michal@greenenergy.co.il',
      description: 'חברת אנרגיה מתחדשת - קידום חקיקה ירוקה ורגולציה סביבתית',
      keywords: 'אנרגיה,סביבה,ירוק,מתחדשת,סולארי,פחמן,אקלים',
      users: {
        create: [
          { userId: moshe.id, role: 'lead' },
        ],
      },
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: 'פורום ההייטק',
      industry: 'טכנולוגיה',
      contactName: 'אורי טק',
      contactEmail: 'uri@techforum.co.il',
      description: 'פורום חברות ההייטק - קידום מדיניות חדשנות וטכנולוגיה',
      keywords: 'הייטק,טכנולוגיה,חדשנות,סטארטאפ,דיגיטלי,סייבר,מחשוב',
      users: {
        create: [
          { userId: yoav.id, role: 'lead' },
          { userId: matan.id, role: 'member' },
        ],
      },
    },
  })

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'סיכום דיון ועדת הכלכלה - הצעת חוק מפעלים',
        type: 'summary',
        priority: 'high',
        status: 'pending',
        clientId: client1.id,
        assigneeId: gal.id,
      },
      {
        title: 'מכתב לשר האנרגיה בנושא תעריפי חשמל סולארי',
        type: 'letter',
        priority: 'urgent',
        status: 'in_progress',
        clientId: client2.id,
        assigneeId: moshe.id,
      },
      {
        title: 'תוכנית אסטרטגית לקידום חוק חדשנות',
        type: 'strategy',
        priority: 'medium',
        status: 'pending',
        clientId: client3.id,
        assigneeId: matan.id,
      },
      {
        title: 'מחקר רקע - רגולציה בינלאומית באנרגיה מתחדשת',
        type: 'research',
        priority: 'medium',
        status: 'pending',
        clientId: client2.id,
        assigneeId: moshe.id,
      },
      {
        title: 'הכנת נייר עמדה בנושא מיסוי הייטק',
        type: 'general',
        priority: 'high',
        status: 'in_progress',
        clientId: client3.id,
        assigneeId: yoav.id,
      },
      {
        title: 'סיכום פגישה עם ח"כ בנושא חוק התקציב',
        type: 'summary',
        priority: 'low',
        status: 'completed',
        clientId: client1.id,
        assigneeId: matan.id,
      },
    ],
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
