import { z } from 'zod'

export const BookingSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/),
  eventType: z.enum(['worship', 'concert', 'wedding', 'funeral', 'conference', 'community', 'other']),
  eventDate: z.string().min(1),
  eventTime: z.string().min(1),
  location: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
  website: z.string().optional() // honeypot
})

export type BookingInput = z.infer<typeof BookingSchema>

