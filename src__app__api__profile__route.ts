import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      title: true,
      bio: true,
      avatar: true,
    },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()

  // Password change
  if (body.currentPassword && body.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'סיסמה נוכחית שגויה' }, { status: 400 })

    const hash = await bcrypt.hash(body.newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    })

    return NextResponse.json({ success: true })
  }

  // Profile update
  const data: any = {}
  if (body.name) data.name = body.name
  if (body.phone !== undefined) data.phone = body.phone
  if (body.title !== undefined) data.title = body.title
  if (body.bio !== undefined) data.bio = body.bio

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, phone: true, title: true, bio: true },
  })

  return NextResponse.json(user)
}
