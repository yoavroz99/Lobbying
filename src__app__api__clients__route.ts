import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const role = (session.user as any).role

  let clients
  if (role === 'admin') {
    clients = await prisma.client.findMany({
      include: {
        _count: { select: { tasks: true } },
        users: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  } else {
    clients = await prisma.client.findMany({
      where: { users: { some: { userId } } },
      include: {
        _count: { select: { tasks: true } },
        users: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const userId = (session.user as any).id

  const client = await prisma.client.create({
    data: {
      name: body.name,
      industry: body.industry,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      description: body.description,
      keywords: body.keywords,
      users: {
        create: { userId, role: 'lead' },
      },
    },
  })

  return NextResponse.json(client)
}
