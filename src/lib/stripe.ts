// Server-only -- importeer dit NOOIT in client components
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Re-export voor server-side gebruik
export { PLANS, CREDIT_PACKAGES } from './plans'
export type { PlanId, CreditPackageId } from './plans'
