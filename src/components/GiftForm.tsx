import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Gift, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { giftFormSchema, type GiftFormData, occasions } from "@/lib/schemas"

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export default function GiftForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false)

  const form = useForm<GiftFormData>({
    resolver: zodResolver(giftFormSchema),
    defaultValues: {
      recipient: "",
      budget: undefined,
      occasion: "",
      customOccasion: "",
      interests: "",
      recaptchaToken: "",
    },
  })

  // Load reCAPTCHA script
  React.useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsRecaptchaLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const executeRecaptcha = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha || !isRecaptchaLoaded) {
        reject(new Error("reCAPTCHA nie jest załadowana"))
        return
      }

      // Render reCAPTCHA widget if not already rendered
      if (!window.grecaptcha.getResponse()) {
        const widgetId = window.grecaptcha.render('recaptcha-container', {
          sitekey: 'YOUR_RECAPTCHA_SITE_KEY', // TODO: Replace with actual site key
          callback: (token: string) => {
            resolve(token)
          },
          'error-callback': () => {
            reject(new Error("Błąd weryfikacji reCAPTCHA"))
          }
        })
      } else {
        const token = window.grecaptcha.getResponse()
        if (token) {
          resolve(token)
        } else {
          reject(new Error("Brak tokenu reCAPTCHA"))
        }
      }
    })
  }

  const onSubmit = async (data: GiftFormData) => {
    setIsLoading(true)
    setError("")
    setAiResponse("")

    try {
      // Execute reCAPTCHA verification
      const recaptchaToken = await executeRecaptcha()
      
      // Prepare form data with recaptcha token
      const formData = {
        ...data,
        recaptchaToken,
        // Use custom occasion if "inne" is selected
        finalOccasion: data.occasion === "inne" ? data.customOccasion : data.occasion,
      }

      // Submit to AI endpoint
      const response = await fetch('/api/generate-gift-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        if (response.status === 524) {
          throw new Error("Oj, chyba się zagubiłem. Spróbujmy jeszcze raz!")
        }
        throw new Error(`Błąd: ${response.status}`)
      }

      const result = await response.json()
      setAiResponse(result.giftIdeas)

    } catch (error) {
      console.error('Error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const watchOccasion = form.watch("occasion")

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Gift className="h-12 w-12 text-purple-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              Pomocnik Prezentowy
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Znajdź idealny prezent dla najbliższych z pomocą AI
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Recipient Field */}
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dla kogo jest prezent?</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="np. mama, tata, chłopak, dziewczyna..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Budget Field */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budżet (PLN)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          placeholder="np. 100"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value === "" ? undefined : Number(value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Occasion Field */}
                <FormField
                  control={form.control}
                  name="occasion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Okazja</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz okazję" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {occasions.map((occasion) => (
                            <SelectItem key={occasion.value} value={occasion.value}>
                              {occasion.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custom Occasion Field - shown only when "inne" is selected */}
                {watchOccasion === "inne" && (
                  <FormField
                    control={form.control}
                    name="customOccasion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jaka okazja?</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Wpisz nazwę okazji..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Interests Field */}
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zainteresowania</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Wpisz zainteresowania osoby obdarowywanej oddzielone przecinkami, np. sport, książki, gotowanie, technologia, podróże..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* reCAPTCHA Container */}
                <div id="recaptcha-container" className="flex justify-center"></div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg"
                  disabled={isLoading || !isRecaptchaLoaded}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Szukam pomysłów...
                    </>
                  ) : (
                    "Znajdź prezenty!"
                  )}
                </Button>
              </form>
            </Form>

            {/* Error Display */}
            {error && (
              <Card className="mt-6 border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive text-center font-medium">{error}</p>
                  {error === "Oj, chyba się zagubiłem. Spróbujmy jeszcze raz!" && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => form.handleSubmit(onSubmit)()}
                      disabled={isLoading}
                    >
                      Spróbuj ponownie
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Response Display */}
            {aiResponse && (
              <Card className="mt-6 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Pomysły na prezenty</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-green-700">
                    {aiResponse}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 