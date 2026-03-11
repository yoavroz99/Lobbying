import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session) return null
  if ((session.user as any).role !== 'admin') return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      title: true,
      bio: true,
      createdAt: true,
      _count: { select: { tasks: true, clients: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { email, name, password, role, phone, title } = body

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'שדות חובה חסרים' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'כתובת אימייל כבר קיימת במערכת' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: role || 'lobbyist',
      phone: phone || null,
      title: title || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      title: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body

  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.role !== undefined) updateData.role = data.role
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.title !== undefined) updateData.title = data.title
  if (data.bio !== undefined) updateData.bio = data.bio
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12)
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      title: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  const currentUserId = (session.user as any).id
  if (id === currentUserId) {
    return NextResponse.json({ error: 'לא ניתן למחוק את המשתמש הנוכחי' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
