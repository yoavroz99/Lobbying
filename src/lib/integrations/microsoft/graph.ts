import { Client } from '@microsoft/microsoft-graph-client'
import { getValidMicrosoftToken } from './auth'

function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })
}

export async function sendEmail(
  userId: string,
  to: string[],
  subject: string,
  htmlBody: string
): Promise<void> {
  const token = await getValidMicrosoftToken(userId)
  if (!token) throw new Error('Microsoft account not connected or token expired')

  const client = getGraphClient(token)

  const message = {
    subject,
    body: {
      contentType: 'HTML',
      content: htmlBody,
    },
    toRecipients: to.map((email) => ({
      emailAddress: { address: email },
    })),
  }

  await client.api('/me/sendMail').post({ message })
}

export async function createDraft(
  userId: string,
  to: string[],
  subject: string,
  htmlBody: string
): Promise<string> {
  const token = await getValidMicrosoftToken(userId)
  if (!token) throw new Error('Microsoft account not connected or token expired')

  const client = getGraphClient(token)

  const message = {
    subject,
    body: {
      contentType: 'HTML',
      content: htmlBody,
    },
    toRecipients: to.map((email) => ({
      emailAddress: { address: email },
    })),
  }

  const result = await client.api('/me/messages').post(message)
  return result.id
}

export async function getMicrosoftUserInfo(accessToken: string): Promise<{ id: string; mail: string; displayName: string }> {
  const client = getGraphClient(accessToken)
  const user = await client.api('/me').select('id,mail,displayName').get()
  return { id: user.id, mail: user.mail || user.userPrincipalName, displayName: user.displayName }
}
