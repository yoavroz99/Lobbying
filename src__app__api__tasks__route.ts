import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const status = searchParams.get('status')

  const where: any = {}
  if (clientId) where.clientId = clientId
  if (status) where.status = status

  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (role !== 'admin') {
    where.client = { users: { some: { userId } } }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: [
      { priority: 'asc' },
      { updatedAt: 'desc' },
    ],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const userId = (session.user as any).id

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      type: body.type || 'general',
      priority: body.priority || 'medium',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      clientId: body.clientId,
      assigneeId: body.assigneeId || userId,
    },
    include: {
      client: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(task)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body

  if (data.dueDate) data.dueDate = new Date(data.dueDate)

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      client: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
