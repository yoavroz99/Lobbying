import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateCompletion } from '@/lib/ai/openai'
import { SYSTEM_PROMPTS, type AITaskType } from '@/lib/ai/prompts'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const { type, prompt, clientId, taskId } = body

  if (!type || !prompt) {
    return NextResponse.json({ error: 'Missing type or prompt' }, { status: 400 })
  }

  const systemPrompt = SYSTEM_PROMPTS[type as AITaskType]
  if (!systemPrompt) {
    return NextResponse.json({ error: 'Invalid AI task type' }, { status: 400 })
  }

  // Create AI request record
  const aiRequest = await prisma.aIRequest.create({
    data: {
      type,
      prompt,
      status: 'processing',
      userId,
    },
  })

  try {
    const response = await generateCompletion(systemPrompt, prompt)

    // Update AI request with response
    await prisma.aIRequest.update({
      where: { id: aiRequest.id },
      data: { response, status: 'completed' },
    })

    // If linked to a task, save the AI content there too
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { aiContent: response, aiGenerated: true },
      })
    }

    return NextResponse.json({ response, requestId: aiRequest.id })
  } catch (error) {
    await prisma.aIRequest.update({
      where: { id: aiRequest.id },
      data: { status: 'failed' },
    })

    return NextResponse.json(
      { error: 'שגיאה ביצירת תוכן AI' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const requests = await prisma.aIRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(requests)
}
