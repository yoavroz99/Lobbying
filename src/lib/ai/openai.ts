import OpenAI from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (client) return client

  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT

  if (apiKey && endpoint) {
    // Azure OpenAI
    client = new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-01' },
      defaultHeaders: { 'api-key': apiKey },
    })
  } else {
    // Fallback: return a mock that returns placeholder text
    client = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{
              message: {
                content: 'שירות AI לא מוגדר. אנא הגדר את משתני הסביבה של Azure OpenAI.',
              },
            }],
          }),
        },
      },
    } as unknown as OpenAI
  }

  return client
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const ai = getOpenAIClient()
  const response = await ai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  })

  return response.choices[0]?.message?.content || 'לא התקבלה תשובה'
}
