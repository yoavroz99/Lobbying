import { google } from 'googleapis'
import { getGoogleOAuth2Client } from './auth'

function getDriveClient(accessToken: string) {
  const oauth2Client = getGoogleOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.drive({ version: 'v3', auth: oauth2Client })
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
}

export async function listFolderFiles(accessToken: string, folderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient(accessToken)

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime)',
    pageSize: 100,
  })

  return (res.data.files || []) as DriveFile[]
}

export async function exportFileAsText(accessToken: string, fileId: string, mimeType: string): Promise<string | null> {
  const drive = getDriveClient(accessToken)

  try {
    // Google Docs: export as plain text
    if (mimeType === 'application/vnd.google-apps.document') {
      const res = await drive.files.export({
        fileId,
        mimeType: 'text/plain',
      }, { responseType: 'text' })
      return res.data as string
    }

    // Google Sheets: export as CSV
    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      const res = await drive.files.export({
        fileId,
        mimeType: 'text/csv',
      }, { responseType: 'text' })
      return res.data as string
    }

    // Google Slides: export as plain text
    if (mimeType === 'application/vnd.google-apps.presentation') {
      const res = await drive.files.export({
        fileId,
        mimeType: 'text/plain',
      }, { responseType: 'text' })
      return res.data as string
    }

    // Plain text files: download directly
    if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/csv') {
      const res = await drive.files.get({
        fileId,
        alt: 'media',
      }, { responseType: 'text' })
      return res.data as string
    }

    // Unsupported file types
    return null
  } catch {
    return null
  }
}

export async function getFolderName(accessToken: string, folderId: string): Promise<string | null> {
  const drive = getDriveClient(accessToken)
  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'name',
    })
    return res.data.name || null
  } catch {
    return null
  }
}

export async function getGoogleUserInfo(accessToken: string): Promise<{ id: string; email: string }> {
  const oauth2Client = getGoogleOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const res = await oauth2.userinfo.get()
  return { id: res.data.id || '', email: res.data.email || '' }
}
