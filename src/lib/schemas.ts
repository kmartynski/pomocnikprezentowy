import { z } from "zod"

export const giftFormSchema = z.object({
  recipient: z.string().min(1, "Podaj dla kogo jest prezent").max(100, "Maksymalnie 100 znaków"),
  budget: z.number({
    required_error: "Budżet jest wymagany",
    invalid_type_error: "Budżet musi być liczbą",
  }).min(1, "Budżet musi być większy niż 0"),
  occasion: z.string().min(1, "Wybierz okazję"),
  customOccasion: z.string().optional(),
  interests: z.string().min(1, "Podaj zainteresowania osoby obdarowywanej").max(500, "Maksymalnie 500 znaków"),
  recaptchaToken: z.string().min(1, "Weryfikacja reCAPTCHA jest wymagana"),
}).refine((data) => {
  // Jeśli wybrano "inne" jako okazję, custom occasion jest wymagana
  if (data.occasion === "inne" && (!data.customOccasion || data.customOccasion.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Podaj nazwę okazji",
  path: ["customOccasion"]
});

export type GiftFormData = z.infer<typeof giftFormSchema>

export const occasions = [
  { value: "urodziny", label: "Urodziny" },
  { value: "rocznica", label: "Rocznica" },
  { value: "walentynki", label: "Walentynki" },
  { value: "święta", label: "Święta" },
  { value: "ślub", label: "Ślub" },
  { value: "dzień-matki", label: "Dzień Matki" },
  { value: "dzień-ojca", label: "Dzień Ojca" },
  { value: "dzień-dziecka", label: "Dzień Dziecka" },
  { value: "dzień-dziadka", label: "Dzień Dziadka" },
  { value: "dzień-babci", label: "Dzień Babci" },
  { value: "inne", label: "Inne" },
] as const; 