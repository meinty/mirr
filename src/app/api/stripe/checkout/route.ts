import { stripe, PLANS, CREDIT_PACKAGES, type PlanId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getOrCreateCustomer(userId: string, email: string | undefined) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  })

  await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await req.json()
  const customerId = await getOrCreateCustomer(user.id, user.email)

  // Abonnement
  if (body.planId) {
    const plan = PLANS[body.planId as PlanId]
    if (!plan || plan.id === 'free') {
      return NextResponse.json({ error: 'Ongeldig plan' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'ideal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Mirr ${plan.name}`, description: plan.description },
          unit_amount: plan.price,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade`,
      metadata: { user_id: user.id, plan_id: plan.id },
    })

    return NextResponse.json({ url: session.url })
  }

  // Losse credits
  if (body.packageId) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === body.packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Ongeldig pakket' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'ideal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Mirr ${pkg.name}`, description: pkg.description },
          unit_amount: pkg.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits=added`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade`,
      metadata: { user_id: user.id, credits: pkg.credits.toString() },
    })

    return NextResponse.json({ url: session.url })
  }

  return NextResponse.json({ error: 'Geef planId of packageId mee' }, { status: 400 })
}
