# Pomocnik Prezentowy

Asystent AI do szukania pomysłów na prezenty dla najbliższych, zbudowany z wykorzystaniem Astro, React i Azure OpenAI.

## Funkcjonalności

- 🎁 Formularz z 4 pytaniami o odbiorcę, budżet, okazję i zainteresowania
- 🔒 Zabezpieczenie reCAPTCHA
- 🧠 Integracja z Azure OpenAI do generowania spersonalizowanych pomysłów na prezenty
- 📱 Responsywny design (desktop i mobile)
- ⚡ Obsługa błędów timeout (524) z możliwością ponownego wysłania
- 🎨 Nowoczesny UI z shadcn/ui i Tailwind CSS

## Instalacja

1. Zainstaluj zależności:
```bash
npm install
```

2. Skonfiguruj zmienne środowiskowe (stwórz plik `.env`):
```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# reCAPTCHA Configuration (opcjonalne - należy skonfigurować w kodzie)
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

3. Skonfiguruj reCAPTCHA:
   - Przejdź do [Google reCAPTCHA](https://www.google.com/recaptcha/)
   - Zarejestruj swoją domenę
   - Zamień `YOUR_RECAPTCHA_SITE_KEY` w pliku `src/components/GiftForm.tsx` na prawdziwy klucz

## Uruchomienie

```bash
# Tryb deweloperski
npm run dev

# Build produkcyjny
npm run build

# Podgląd buildu
npm run preview
```

## Struktura projektu

```
/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/           # Komponenty shadcn/ui
│   │   └── GiftForm.tsx  # Główny formularz
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   ├── schemas.ts    # Walidacja Zod
│   │   └── utils.ts      # Pomocnicze funkcje
│   ├── pages/
│   │   ├── api/
│   │   │   └── generate-gift-ideas.ts  # API endpoint
│   │   └── index.astro   # Strona główna
│   └── styles/
│       └── globals.css   # Style globalne
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
└── tsconfig.json
```

## Konfiguracja Azure OpenAI

1. Stwórz zasób Azure OpenAI w portalu Azure
2. Wdróż model (np. GPT-4o)
3. Skopiuj endpoint i klucz API
4. Skonfiguruj zmienne środowiskowe

## Deployment na Cloudflare

Projekt jest skonfigurowany do deploymentu na Cloudflare Pages:

```bash
npm run build
```

Skonfiguruj zmienne środowiskowe w panelu Cloudflare Pages.

## Technologie

- **Astro** - Framework webowy
- **React** - Komponenty UI
- **TypeScript** - Typowanie
- **Tailwind CSS** - Style
- **shadcn/ui** - Komponenty UI
- **React Hook Form** - Obsługa formularzy
- **Zod** - Walidacja
- **Azure OpenAI** - AI do generowania pomysłów
- **reCAPTCHA** - Ochrona przed botami 