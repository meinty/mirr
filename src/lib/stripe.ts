import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Abonnementen (maandelijks, goedkoper per credit)
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    creditsPerMonth: 1,
    description: '1 Lite audit bij aanmelden',
    features: ['1 audit inclusief', 'Visibility score', '3 key findings', 'Beperkt rapport'],
    priceId: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 7900,
    creditsPerMonth: 3,
    description: '3 volledige audits per maand',
    features: ['3 audits per maand', 'Volledig rapport', 'Identity gap analyse', 'Competitor benchmark', 'PDF export'],
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 19900,
    creditsPerMonth: 10,
    description: '10 audits per maand + white-label',
    features: ['10 audits per maand', 'Alles van Pro', 'White-label PDF', 'Prioriteit support'],
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
  },
} as const

export type PlanId = keyof typeof PLANS

// Losse credits (eenmalig, geen commitment)
export const CREDIT_PACKAGES = [
  {
    id: 'single',
    name: '1 credit',
    credits: 1,
    price: 3900,
    pricePerCredit: 3900,
    description: '1 volledige audit',
  },
  {
    id: 'five',
    name: '5 credits',
    credits: 5,
    price: 16900,
    pricePerCredit: 3380,
    description: '13% korting per credit',
  },
  {
    id: 'ten',
    name: '10 credits',
    credits: 10,
    price: 27900,
    pricePerCredit: 2790,
    description: '28% korting per credit',
  },
]

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id']
