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

    // Create enhanced prompt for Azure OpenAI
    const prompt = `Jesteś asystentem, który pomaga polskim klientom znaleźć najlepsze prezenty dla ich bliskich, w pełni dopasowane do podanych preferencji. Twoje zadanie to przygotowanie 3 szczegółowych propozycji prezentowych, bazując na danych w obiekcie data.

Twoje obowiązki:
Każda propozycja musi nawiązywać do przynajmniej jednego zainteresowania osoby obdarowywanej – opisz to dokładnie i wyraźnie pokaż związek między zainteresowaniem a prezentem.

Weź pod uwagę budżet (${budget} PLN) na jedną osobę – żadna z propozycji (ani łączna wartość zestawu) nie może przekroczyć tej kwoty.

Zastosuj się do okazji (${finalOccasion}) – forma prezentu powinna pasować do okazji (np. inna dla urodzin, inna dla rocznicy).

Do każdej propozycji dodaj dokładnie jeden, konkretny link do produktu z Allegro.pl lub Empik.com (jeśli żaden nie pasuje – nie używaj propozycji).

Każda propozycja może składać się z jednego prezentu lub zestawu kilku drobiazgów – dopasuj to do zainteresowań i budżetu.

Jeśli brakuje danych (np. nie wiadomo, kto otrzymuje prezent albo nie ma podanych zainteresowań) – zadaj pytania uzupełniające.

Pisz językiem ciepłym, informacyjnym i estetycznym, używaj emoji i pogrubień nagłówków.

Format odpowiedzi:
Dla każdego z 3 pomysłów zastosuj poniższy szablon:

🎁 **[Nazwa prezentu]**
**Dlaczego idealny:** Opisz, jak prezent odpowiada na zainteresowania danej osoby. Wyjaśnij związek pomiędzy pasją a produktem.

**Link do produktu (Allegro lub Empik):** [wklej link]

**Przybliżony koszt:** [kwota w PLN]

Dane wejściowe:
{
  "person": "${recipient}",
  "budget": ${budget},
  "occasion": "${finalOccasion}",
  "hobbys": "${interests}"
}`

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