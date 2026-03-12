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

  // Create a sample client with real keywords for scraping
  const sampleClient = await prisma.client.upsert({
    where: { id: 'sample-client-tech' },
    update: {
      keywords: 'טכנולוגיה,חדשנות,סייבר,הייטק,בינה מלאכותית,דיגיטל,תקשורת,מחשבים,סטארטאפ',
      industry: 'טכנולוגיה והייטק',
      description: 'חברת טכנולוגיה מובילה המעוניינת במעקב אחר חקיקה ורגולציה בתחום ההייטק, הסייבר והחדשנות בישראל',
      contactName: 'דני כהן',
      contactEmail: 'danny@techcorp.co.il',
      contactPhone: '03-1234567',
    },
    create: {
      id: 'sample-client-tech',
      name: 'טק קורפ ישראל',
      industry: 'טכנולוגיה והייטק',
      contactName: 'דני כהן',
      contactEmail: 'danny@techcorp.co.il',
      contactPhone: '03-1234567',
      description: 'חברת טכנולוגיה מובילה המעוניינת במעקב אחר חקיקה ורגולציה בתחום ההייטק, הסייבר והחדשנות בישראל',
      keywords: 'טכנולוגיה,חדשנות,סייבר,הייטק,בינה מלאכותית,דיגיטל,תקשורת,מחשבים,סטארטאפ',
      status: 'active',
    },
  })

  // Link yoav as lead, all other users as members
  for (const [user, role] of [[yoav, 'lead'], [gal, 'member'], [moshe, 'member'], [matan, 'member']] as const) {
    await prisma.userClient.upsert({
      where: { userId_clientId: { userId: user.id, clientId: sampleClient.id } },
      update: {},
      create: { userId: user.id, clientId: sampleClient.id, role },
    })
  }

  // Seed sample scraped data (realistic examples from real Israeli sources)
  const sampleScrapedItems = [
    // Knesset committee sessions
    {
      source: 'knesset_committee',
      sourceUrl: 'https://main.knesset.gov.il/Activity/committees/Pages/CommitteeSession.aspx?ItemID=2120100',
      title: 'ועדת המדע והטכנולוגיה: דיון בנושא רגולציה על בינה מלאכותית',
      content: 'דיון בנושא הסדרת השימוש בבינה מלאכותית בישראל, כולל היבטי פרטיות, אתיקה ואחריות. הוועדה תדון בהצעות לרגולציה מקדמת ובצורך לעדכן את החקיקה הקיימת.',
      date: new Date('2026-03-10'),
      committee: 'ועדת המדע והטכנולוגיה',
      clientId: sampleClient.id,
      relevance: 0.8,
    },
    {
      source: 'knesset_committee',
      sourceUrl: 'https://main.knesset.gov.il/Activity/committees/Pages/CommitteeSession.aspx?ItemID=2120095',
      title: 'ועדת הכלכלה: תוכנית הממשלה לקידום הייטק בפריפריה',
      content: 'הוועדה דנה בתוכנית הממשלתית להעברת חברות טכנולוגיה לפריפריה, כולל הטבות מס ותמריצים לחברות הייטק שיקימו מרכזי פיתוח מחוץ למרכז.',
      date: new Date('2026-03-09'),
      committee: 'ועדת הכלכלה',
      clientId: sampleClient.id,
      relevance: 0.7,
    },
    {
      source: 'knesset_committee',
      sourceUrl: 'https://main.knesset.gov.il/Activity/committees/Pages/CommitteeSession.aspx?ItemID=2120080',
      title: 'ועדת החוקה: הגנה על מידע ביומטרי',
      content: 'דיון בהצעת חוק להגנה על מידע ביומטרי שנאסף על ידי חברות טכנולוגיה. ההצעה מבקשת להגביל את השימוש בזיהוי פנים ובאמצעי זיהוי ביומטריים אחרים.',
      date: new Date('2026-03-08'),
      committee: 'ועדת החוקה, חוק ומשפט',
      clientId: sampleClient.id,
      relevance: 0.6,
    },
    {
      source: 'knesset_committee',
      sourceUrl: 'https://main.knesset.gov.il/Activity/committees/Pages/CommitteeSession.aspx?ItemID=2120070',
      title: 'ועדת הפנים: רפורמה במערכת הרישוי העסקי',
      content: 'הוועדה דנה ברפורמה מקיפה במערכת הרישוי העסקי בישראל, כולל דיגיטציה של תהליכים וקיצור לוחות זמנים.',
      date: new Date('2026-03-07'),
      committee: 'ועדת הפנים והגנת הסביבה',
      clientId: null,
      relevance: null,
    },
    // Legislation
    {
      source: 'legislation',
      sourceUrl: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx?t=LawsAll&lawitemid=2099837',
      title: 'הצעת חוק הסייבר הלאומי (תיקון - חובות דיווח מורחבות)',
      content: 'הצעת חוק לתיקון חוק הסייבר הלאומי המרחיבה את חובות הדיווח של גופים פרטיים על אירועי סייבר. ההצעה מחייבת דיווח תוך 24 שעות על אירועים מהותיים.',
      date: new Date('2026-03-11'),
      clientId: sampleClient.id,
      relevance: 0.9,
    },
    {
      source: 'legislation',
      sourceUrl: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx?t=LawsAll&lawitemid=2099820',
      title: 'הצעת חוק לעידוד חדשנות טכנולוגית במגזר הציבורי',
      content: 'הצעת חוק המחייבת משרדי ממשלה לאמץ טכנולוגיות חדשניות ולהקים יחידות חדשנות. ההצעה כוללת תקציב ייעודי לפיילוטים טכנולוגיים.',
      date: new Date('2026-03-06'),
      clientId: sampleClient.id,
      relevance: 0.85,
    },
    {
      source: 'legislation',
      sourceUrl: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx?t=LawsAll&lawitemid=2099800',
      title: 'הצעת חוק שירותי ענן (רגולציה ופיקוח)',
      content: 'הצעת חוק להסדרת שירותי מחשוב ענן בישראל, כולל דרישות אבטחה, מיקום שרתים ופיקוח רגולטורי על ספקי שירותי ענן.',
      date: new Date('2026-03-05'),
      clientId: sampleClient.id,
      relevance: 0.75,
    },
    // Government decisions
    {
      source: 'gov_decision',
      sourceUrl: 'https://www.gov.il/he/departments/policies/digital-transformation-2026',
      title: 'החלטת ממשלה: תוכנית לאומית לטרנספורמציה דיגיטלית',
      content: 'הממשלה אישרה תוכנית לאומית רב-שנתית לטרנספורמציה דיגיטלית בשירות הציבורי. התוכנית כוללת השקעה של 2 מיליארד שקל על פני 5 שנים.',
      date: new Date('2026-03-04'),
      clientId: sampleClient.id,
      relevance: 0.7,
    },
    {
      source: 'gov_decision',
      sourceUrl: 'https://www.gov.il/he/departments/policies/cyber-defense-update-2026',
      title: 'עדכון מדיניות הגנת סייבר לאומית',
      content: 'הממשלה עדכנה את מדיניות הגנת הסייבר הלאומית, כולל דרישות חדשות לתשתיות קריטיות והגדלת תקציב מערך הסייבר הלאומי.',
      date: new Date('2026-03-03'),
      clientId: sampleClient.id,
      relevance: 0.85,
    },
    {
      source: 'gov_decision',
      sourceUrl: 'https://www.gov.il/he/departments/policies/housing-reform-2026',
      title: 'רפורמה בשוק הדיור: תוכנית "דירה לכל אזרח"',
      content: 'הממשלה אישרה רפורמה מקיפה בשוק הדיור הכוללת שחרור קרקעות, ייעול תהליכי תכנון ובנייה, והקמת ועדות תכנון מהירות.',
      date: new Date('2026-03-02'),
      clientId: null,
      relevance: null,
    },
    // News articles
    {
      source: 'news',
      sourceUrl: 'https://www.calcalist.co.il/tech/article/example1',
      title: 'ישראל בצמרת: דוח חדש מדרג את ישראל במקום השלישי בעולם בתחום הסייבר',
      content: 'לפי דוח חדש של חברת מחקר בינלאומית, ישראל מדורגת במקום השלישי בעולם בתחום הסייבר, אחרי ארה"ב ובריטניה. הדוח מציין את ההשקעה הממשלתית והצבאית בתחום.',
      date: new Date('2026-03-11'),
      clientId: sampleClient.id,
      relevance: 0.9,
    },
    {
      source: 'news',
      sourceUrl: 'https://www.globes.co.il/news/article.aspx?did=example2',
      title: 'סטארטאפ ישראלי בתחום הבינה המלאכותית גייס 100 מיליון דולר',
      content: 'חברת AI ישראלית הודיעה על סבב גיוס של 100 מיליון דולר בהובלת קרן הון סיכון אמריקאית. החברה מפתחת פתרונות בינה מלאכותית לתעשייה.',
      date: new Date('2026-03-10'),
      clientId: sampleClient.id,
      relevance: 0.85,
    },
    {
      source: 'news',
      sourceUrl: 'https://www.ynet.co.il/digital/technews/article/example3',
      title: 'מיקרוסופט מרחיבה את פעילות מרכז הפיתוח בישראל',
      content: 'מיקרוסופט הודיעה על הרחבת מרכז הפיתוח שלה בישראל עם 500 משרות חדשות, בדגש על פיתוח בינה מלאכותית ואבטחת סייבר.',
      date: new Date('2026-03-09'),
      clientId: sampleClient.id,
      relevance: 0.8,
    },
    {
      source: 'news',
      sourceUrl: 'https://www.themarker.com/technation/article/example4',
      title: 'רשות החדשנות: תוכנית חדשה לתמיכה בסטארטאפים בתחום הקלינטק',
      content: 'רשות החדשנות הכריזה על תוכנית חדשה בשווי 200 מיליון שקל לתמיכה בסטארטאפים ישראליים בתחום הטכנולוגיה הנקייה והאנרגיה המתחדשת.',
      date: new Date('2026-03-08'),
      clientId: sampleClient.id,
      relevance: 0.65,
    },
    {
      source: 'news',
      sourceUrl: 'https://www.calcalist.co.il/internet/article/example5',
      title: 'האיחוד האירופי מעביר רגולציית AI חדשה - ההשפעה על חברות ישראליות',
      content: 'האיחוד האירופי השלים את חקיקת ה-AI Act. מומחים ישראליים מזהירים שחברות הייטק ישראליות שפועלות באירופה יצטרכו להתאים את המוצרים שלהן לדרישות החדשות.',
      date: new Date('2026-03-07'),
      clientId: sampleClient.id,
      relevance: 0.75,
    },
    {
      source: 'news',
      sourceUrl: 'https://www.ynet.co.il/economy/article/example6',
      title: 'שוק ההייטק הישראלי: ירידה של 15% בגיוסי הון ברבעון הראשון',
      content: 'נתוני IVC מראים ירידה של 15% בגיוסי ההון של חברות הייטק ישראליות ברבעון הראשון של 2026 בהשוואה לתקופה המקבילה אשתקד.',
      date: new Date('2026-03-06'),
      clientId: sampleClient.id,
      relevance: 0.7,
    },
  ]

  // Clear existing scraped items and insert fresh sample data
  await prisma.scrapedItem.deleteMany({})
  for (const item of sampleScrapedItems) {
    await prisma.scrapedItem.create({
      data: item,
    })
  }

  console.log('Seed completed successfully!')
  console.log('Users (all passwords: lobby123):')
  console.log('  yoav@jlm-group.com - יואב רוזנבלט (מנהל)')
  console.log('  gal@jlm-group.com - גל גולן (שדלן)')
  console.log('  moshe@jlm-group.com - משה ברדוגו (שדלן)')
  console.log('  matan@jlm-group.com - מתן אופנהיימר (שדלן)')
  console.log(`  Client: ${sampleClient.name} (${sampleClient.id})`)
  console.log(`  Scraped items: ${sampleScrapedItems.length} (${sampleScrapedItems.filter(i => i.source === 'news').length} news articles)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
