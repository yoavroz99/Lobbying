import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getValidGoogleToken } from '@/lib/integrations/google/auth'
import { getFolderName } from '@/lib/integrations/google/drive'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const folders = await prisma.clientDriveFolder.findMany({
    where: { clientId },
    include: { _count: { select: { documents: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(folders)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const { clientId, folderId } = body

  if (!clientId || !folderId) {
    return NextResponse.json({ error: 'Missing clientId or folderId' }, { status: 400 })
  }

  // Extract folder ID from URL if provided
  const extractedId = extractFolderId(folderId)

  // Verify we can access the folder and get its name
  const token = await getValidGoogleToken(userId)
  if (!token) {
    return NextResponse.json({ error: 'Google Drive not connected' }, { status: 400 })
  }

  const folderName = await getFolderName(token, extractedId)
  if (!folderName) {
    return NextResponse.json({ error: 'Could not access folder. Check the folder ID and permissions.' }, { status: 400 })
  }

  try {
    const folder = await prisma.clientDriveFolder.create({
      data: {
        clientId,
        folderId: extractedId,
        folderName,
      },
    })
    return NextResponse.json(folder)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Folder already linked to this client' }, { status: 409 })
    }
    throw error
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.clientDriveFolder.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

function extractFolderId(input: string): string {
  // Handle Google Drive URLs like https://drive.google.com/drive/folders/FOLDER_ID
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  // Otherwise treat as raw folder ID
  return input.trim()
}
