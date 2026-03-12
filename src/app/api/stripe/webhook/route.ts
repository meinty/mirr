import { stripe, PLANS, type PlanId } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.user_id
    if (!userId) return NextResponse.json({ received: true })

    // Eenmalige credits aankoop
    if (session.mode === 'payment') {
      const credits = parseInt(session.metadata?.credits ?? '0')
      if (credits > 0) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        await supabaseAdmin
          .from('profiles')
          .update({ credits: (profile?.credits ?? 0) + credits })
          .eq('id', userId)
      }
    }

    // Abonnement gestart
    if (session.mode === 'subscription') {
      const planId = session.metadata?.plan_id as PlanId | undefined
      const subscriptionId = session.subscription as string
      if (!planId || !PLANS[planId]) return NextResponse.json({ received: true })

      const plan = PLANS[planId]
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      await supabaseAdmin
        .from('profiles')
        .update({
          plan: planId,
          stripe_subscription_id: subscriptionId,
          credits: (profile?.credits ?? 0) + plan.creditsPerMonth,
        })
        .eq('id', userId)
    }
  }

  // Maandelijkse verlenging: credits aanvullen
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object
    if (invoice.billing_reason !== 'subscription_cycle') return NextResponse.json({ received: true })

    const customerId = invoice.customer as string
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, plan, credits')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile || !profile.plan || profile.plan === 'free') return NextResponse.json({ received: true })

    const plan = PLANS[profile.plan as PlanId]
    await supabaseAdmin
      .from('profiles')
      .update({ credits: (profile.credits ?? 0) + plan.creditsPerMonth })
      .eq('id', profile.id)
  }

  // Abonnement opgezegd
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const customerId = subscription.customer as string

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('id', profile.id)
    }
  }

  return NextResponse.json({ received: true })
}
