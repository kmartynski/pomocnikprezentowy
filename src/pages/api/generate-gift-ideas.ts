import type { APIRoute } from 'astro'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT!}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME!}`,
  defaultQuery: { 'api-version': '2024-02-01' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY!,
  },
})

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { recipient, budget, finalOccasion, interests, recaptchaToken } = body

    // Verify reCAPTCHA (simplified - you should verify with Google's API)
    if (!recaptchaToken) {
      return new Response(
        JSON.stringify({ error: 'Brak weryfikacji reCAPTCHA' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!recipient || !budget || !finalOccasion || !interests) {
      return new Response(
        JSON.stringify({ error: 'Wszystkie pola są wymagane' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create prompt for Azure OpenAI
    const prompt = `Jesteś doświadczonym konsultantem prezentowym. Pomóż znaleźć idealny prezent na podstawie następujących informacji:

**Odbiorca:** ${recipient}
**Budżet:** ${budget} PLN
**Okazja:** ${finalOccasion}
**Zainteresowania:** ${interests}

Proszę zasugeruj 3-5 konkretnych pomysłów na prezenty, które:
- Mieszczą się w podanym budżecie
- Są odpowiednie dla tej okazji
- Pasują do zainteresowań odbiorcy
- Można je kupić w Polsce

Dla każdego pomysłu podaj:
1. Nazwę prezentu
2. Przybliżoną cenę
3. Krótkie uzasadnienie wyboru
4. Gdzie można to kupić (rodzaj sklepu)

Odpowiedz w przyjaznym, pomocnym tonie po polsku.`

    // Call Azure OpenAI
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!, // e.g., "gpt-4o"
      messages: [
        {
          role: 'system',
          content: 'Jesteś pomocnym asystentem specjalizującym się w doradztwie prezentowym. Odpowiadasz zawsze po polsku w przyjaznym tonie.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const giftIdeas = response.choices[0]?.message?.content || 'Nie udało się wygenerować pomysłów na prezenty.'

    return new Response(
      JSON.stringify({ giftIdeas }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    )

  } catch (error) {
    console.error('Error generating gift ideas:', error)
    
    // Handle timeout errors (524)
    if (error instanceof Error && error.message.includes('timeout')) {
      return new Response(
        JSON.stringify({ error: 'Oj, chyba się zagubiłem. Spróbujmy jeszcze raz!' }),
        { status: 524, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Wystąpił błąd podczas generowania pomysłów na prezenty' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 