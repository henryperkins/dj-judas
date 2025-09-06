# Booking Form & Email Delivery

This app includes a mobile‑first booking form with client and server validation, a spam‑resistant fallback, and provider‑agnostic email delivery (Resend or SendGrid).

Pages & Components
- Page: `/book` (Casual tone)
- Component: `src/react-app/components/BookingForm.tsx`
- Styles: `src/react-app/index.css` (Booking Form section)
- API: `POST /api/booking` in `src/worker/index.ts`

## UX & Mobile‑First Details

- Casual copy when rendered with `tone="casual"` (used on `/book`).
- Chip selector for event type on small screens (≤479px) for larger tap targets.
- InputMode and autocomplete hints for better mobile keyboards.
- Local persistence: Form data (except the honeypot) is saved to `localStorage` and cleared after successful submit.
- Error summary: A focusable list appears above the form with links to each field error, improving accessibility.

## Client‑Side Validation

- Required: `name`, `email`, `phone`, `eventType`, `eventDate`, `eventTime`, `location`.
- Email normalized to lowercase with a simple validity check.
- Date/time must be in the future.
- Max lengths: name (100), email (254), phone (32), location (200), message (2000).
- Honeypot: a visually hidden `website` field must remain empty.

## Server‑Side Validation

Handled in `src/worker/index.ts` under `POST /api/booking`:

- Rate limit: best‑effort IP bucket (10/min).
- Required fields enforced; empty trimmed strings rejected.
- Email normalized/lowercased and minimally validated.
- Phone normalized (strip non‑digits except leading `+`); length 7–15 enforced.
- `eventType` checked against an allowed enum.
- Datetime parsed from `eventDate` + `eventTime` and required to be future.
- Max lengths applied; message truncated to 2000 characters.
- Honeypot `website` rejected silently.

## Email Delivery (Resend / SendGrid)

The Worker sends a plain‑text summary email via the first configured provider:

1. Resend (preferred)
   - Secrets: `RESEND_API_KEY`, optional `RESEND_FROM`, `RESEND_TO`
   - Default `from`: `DJ Lee Website <no-reply@djlee.local>`
   - Default `to`: `V.O.J@icloud.com`
2. SendGrid (fallback)
   - Secrets: `SENDGRID_API_KEY`, optional `SENDGRID_FROM`, `SENDGRID_TO`
   - Default `from`: `no-reply@djlee.local`
   - Default `to`: `V.O.J@icloud.com`

If no provider is configured, the API returns 501 with `{ error: 'no_email_provider' }`. The client then offers a mailto fallback.

## Environment Configuration

Set as Wrangler secrets or environment variables:

```
wrangler secret put RESEND_API_KEY
wrangler secret put SENDGRID_API_KEY
wrangler secret put RESEND_FROM
wrangler secret put RESEND_TO
wrangler secret put SENDGRID_FROM
wrangler secret put SENDGRID_TO
```

No client variables are needed for booking.

## Security & Abuse Mitigation

- Honeypot field blocks simple bots without adding captcha friction.
- Per‑IP rate limiting reduces spam bursts (ephemeral; consider KV/Durable Object for stronger limits).
- All server logs should avoid storing message content; log only metadata (not implemented here by default).

## Customization Tips

- Add fields (e.g., attendance, budget range, indoor/outdoor) by extending `FormData` and the Worker’s request shape.
- Wire privacy copy under the submit button; consider linking to a /privacy page.
- For analytics, instrument submission success/failure events (e.g., GA4, Meta Pixel) at the client.

