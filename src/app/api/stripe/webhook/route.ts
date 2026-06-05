import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service-role client — webhook runs outside user session
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.supabase_user_id
    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'pro', stripe_customer_id: session.customer as string })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.supabase_user_id
    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', userId)
    }
  }

  if (event.type === 'invoice.payment_failed') {
    // Optionally downgrade after repeated failures — Stripe handles retries first
    // For now just log; subscription.deleted fires when Stripe finally cancels
  }

  return NextResponse.json({ received: true })
}
