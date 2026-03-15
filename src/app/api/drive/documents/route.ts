import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const folders = await prisma.clientDriveFolder.findMany({
    where: { clientId },
    include: {
      documents: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          lastModified: true,
          createdAt: true,
        },
        orderBy: { lastModified: 'desc' },
      },
    },
  })

  const documents = folders.flatMap((f) =>
    f.documents.map((d) => ({ ...d, folderName: f.folderName }))
  )

  return NextResponse.json(documents)
}
