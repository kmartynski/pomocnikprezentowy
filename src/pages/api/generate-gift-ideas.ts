import type { APIRoute } from 'astro'
import { getSecret } from "astro:env/server";
import { AzureOpenAI } from "openai";

const apiKey = getSecret("AZURE_OPENAI_API_KEY");
const endpoint = getSecret("AZURE_OPENAI_ENDPOINT");
const deploymentName = getSecret("AZURE_OPENAI_DEPLOYMENT_NAME") as string;

export const POST: APIRoute = async ({ request }) => {
  const client = new AzureOpenAI({
    apiKey,
    endpoint,
    apiVersion: "2024-12-01-preview",
  });
  console.log('🚀 API endpoint hit - generate-gift-ideas')
  console.log('🔑 Environment variables check:')
  console.log('- AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('- AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT ? '✅ Set' : '❌ Missing')
  console.log('- AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME ? '✅ Set' : '❌ Missing')
  
  try {
    const body = await request.json()
    console.log('📝 Request body received:', { ...body, recaptchaToken: body.recaptchaToken ? '[HIDDEN]' : 'Missing' })
    const { recipient, budget, finalOccasion, interests } = body

    // Verify reCAPTCHA (simplified - you should verify with Google's API) - TEMPORARILY DISABLED
    // if (!recaptchaToken) {
    //   return new Response(
    //     JSON.stringify({ error: 'Brak weryfikacji reCAPTCHA' }),
    //     { status: 400, headers: { 'Content-Type': 'application/json' } }
    //   )
    // }

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

    console.log('🤖 Calling Azure OpenAI with prompt length:', prompt.length)
    
    // Call Azure OpenAI - o1 model has different parameter requirements
    const response = await client.chat.completions.create({
      model: deploymentName, // o1 model
      messages: [
        {
          role: 'user',  // o1 models don't support system messages
          content: `Jesteś pomocnym asystentem specjalizującym się w doradztwie prezentowym. Odpowiadasz zawsze po polsku w przyjaznym tonie.

${prompt}`
        }
      ]
      // o1 models don't support max_completion_tokens or temperature
    })

    const giftIdeas = response.choices[0]?.message?.content || 'Nie udało się wygenerować pomysłów na prezenty.'
    
    console.log('✅ Azure OpenAI response received, length:', giftIdeas.length)

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