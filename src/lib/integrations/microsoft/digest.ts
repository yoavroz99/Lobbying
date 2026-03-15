import { prisma } from '@/lib/db'
import { generateCompletion } from '@/lib/ai/openai'
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import { sendEmail, createDraft } from './graph'

interface DigestOptions {
  dateFrom?: Date
  dateTo?: Date
}

export async function generateDigestForClient(
  clientId: string,
  options?: DigestOptions
): Promise<{ subject: string; htmlBody: string }> {
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) throw new Error('Client not found')

  const dateFrom = options?.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const dateTo = options?.dateTo || new Date()

  const items = await prisma.scrapedItem.findMany({
    where: {
      clientId,
      createdAt: { gte: dateFrom, lte: dateTo },
    },
    orderBy: [{ relevance: 'desc' }, { createdAt: 'desc' }],
    take: 30,
  })

  if (items.length === 0) {
    return {
      subject: `עדכון שבועי - ${client.name}`,
      htmlBody: `<div dir="rtl" style="font-family: Arial, sans-serif;"><h2>אין עדכונים חדשים לתקופה זו</h2></div>`,
    }
  }

  // Group items by source
  const sourceLabels: Record<string, string> = {
    knesset_committee: 'ועדות כנסת',
    knesset_plenum: 'מליאת הכנסת',
    gov_decision: 'החלטות ממשלה',
    legislation: 'חקיקה',
    news: 'חדשות',
  }

  const grouped: Record<string, typeof items> = {}
  for (const item of items) {
    const key = item.source
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  // Build prompt for AI
  let prompt = `צור אימייל עדכון (digest) עבור הלקוח "${client.name}"`
  if (client.industry) prompt += ` (תעשייה: ${client.industry})`
  prompt += `\n\nתקופה: ${dateFrom.toLocaleDateString('he-IL')} - ${dateTo.toLocaleDateString('he-IL')}\n\n`

  for (const [source, sourceItems] of Object.entries(grouped)) {
    prompt += `\n### ${sourceLabels[source] || source} (${sourceItems.length} פריטים)\n`
    for (const item of sourceItems) {
      prompt += `- ${item.title}`
      if (item.summary) prompt += `: ${item.summary}`
      else if (item.content) prompt += `: ${item.content.substring(0, 200)}`
      prompt += '\n'
    }
  }

  const htmlBody = await generateCompletion(SYSTEM_PROMPTS.digest, prompt)

  // Wrap in RTL container
  const wrappedHtml = `<div dir="rtl" style="font-family: Arial, sans-serif;">${htmlBody}</div>`

  return {
    subject: `עדכון שבועי - ${client.name} - ${dateTo.toLocaleDateString('he-IL')}`,
    htmlBody: wrappedHtml,
  }
}

export async function sendDigest(
  userId: string,
  clientId: string,
  subject: string,
  htmlBody: string,
  recipients: string[],
  action: 'send' | 'draft'
): Promise<{ id: string; status: string; outlookMessageId?: string }> {
  let outlookMessageId: string | undefined
  let status: string

  try {
    if (action === 'send') {
      await sendEmail(userId, recipients, subject, htmlBody)
      status = 'sent'
    } else {
      outlookMessageId = await createDraft(userId, recipients, subject, htmlBody)
      status = 'draft'
    }
  } catch (error) {
    status = 'failed'
  }

  const record = await prisma.digestEmail.create({
    data: {
      clientId,
      userId,
      subject,
      htmlBody,
      recipients: recipients.join(','),
      status,
      outlookMessageId,
      sentAt: status === 'sent' ? new Date() : undefined,
    },
  })

  return { id: record.id, status, outlookMessageId }
}
