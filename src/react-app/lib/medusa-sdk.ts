import Medusa from '@medusajs/js-sdk'

const MEDUSA_URL = import.meta.env.VITE_MEDUSA_URL as string | undefined
const PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY as string | undefined

export const medusaClient = MEDUSA_URL ? new Medusa({
  baseUrl: MEDUSA_URL,
  publishableKey: PUBLISHABLE_KEY,
  auth: {
    type: 'session',
    fetchCredentials: 'include'
  },
  debug: import.meta.env.DEV,
  globalHeaders: {
    'content-type': 'application/json'
  }
}) : null

export const sdk = medusaClient