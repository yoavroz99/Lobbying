import { prisma } from '@/lib/db'
import { getValidGoogleToken } from './auth'
import { listFolderFiles, exportFileAsText } from './drive'

const MAX_CONTEXT_CHARS = 3000

export async function syncDriveFolder(clientDriveFolderId: string, userId: string): Promise<number> {
  const folder = await prisma.clientDriveFolder.findUnique({
    where: { id: clientDriveFolderId },
  })
  if (!folder) throw new Error('Drive folder not found')

  const token = await getValidGoogleToken(userId)
  if (!token) throw new Error('Google account not connected or token expired')

  const files = await listFolderFiles(token, folder.folderId)
  let synced = 0

  for (const file of files) {
    const text = await exportFileAsText(token, file.id, file.mimeType)
    if (text === null) continue

    await prisma.driveDocument.upsert({
      where: {
        folderId_driveFileId: {
          folderId: clientDriveFolderId,
          driveFileId: file.id,
        },
      },
      update: {
        fileName: file.name,
        mimeType: file.mimeType,
        extractedText: text,
        lastModified: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
      },
      create: {
        folderId: clientDriveFolderId,
        driveFileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        extractedText: text,
        lastModified: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
      },
    })
    synced++
  }

  await prisma.clientDriveFolder.update({
    where: { id: clientDriveFolderId },
    data: { lastSyncedAt: new Date() },
  })

  return synced
}

export async function getClientDriveContext(clientId: string): Promise<string> {
  const folders = await prisma.clientDriveFolder.findMany({
    where: { clientId },
    include: {
      documents: {
        where: { extractedText: { not: null } },
        orderBy: { lastModified: 'desc' },
      },
    },
  })

  if (folders.length === 0) return ''

  let context = ''
  let remaining = MAX_CONTEXT_CHARS

  for (const folder of folders) {
    for (const doc of folder.documents) {
      if (remaining <= 0) break
      if (!doc.extractedText) continue

      const header = `\n[${doc.fileName}]:\n`
      const text = doc.extractedText.substring(0, remaining - header.length)
      context += header + text
      remaining -= header.length + text.length
    }
  }

  if (!context) return ''

  return `=== מסמכים רלוונטיים מתיקיית הלקוח ===\n${context}\n=== סוף מסמכים ===\n\n`
}
