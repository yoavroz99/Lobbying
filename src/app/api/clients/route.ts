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

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body

  if (!id) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.industry !== undefined && { industry: data.industry }),
      ...(data.contactName !== undefined && { contactName: data.contactName }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.keywords !== undefined && { keywords: data.keywords }),
      ...(data.status !== undefined && { status: data.status }),
    },
  })

  return NextResponse.json(client)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

  await prisma.client.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
