// Gedeelde plan/credit data -- veilig te importeren op client én server

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    creditsPerMonth: 1,
    description: '1 Lite audit bij aanmelden',
    features: ['1 audit inclusief', 'Visibility score', '3 key findings', 'Beperkt rapport'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 7900,
    creditsPerMonth: 3,
    description: '3 volledige audits per maand',
    features: ['3 audits per maand', 'Volledig rapport', 'Identity gap analyse', 'Competitor benchmark', 'PDF export'],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 19900,
    creditsPerMonth: 10,
    description: '10 audits per maand + white-label',
    features: ['10 audits per maand', 'Alles van Pro', 'White-label PDF', 'Prioriteit support'],
  },
} as const

export type PlanId = keyof typeof PLANS

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
