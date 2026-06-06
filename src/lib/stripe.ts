import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
    })
  }
  return _stripe
}

export const STRIPE_PRO_PRICE_ID = () => {
  if (!process.env.STRIPE_PRO_PRICE_ID) {
    throw new Error('STRIPE_PRO_PRICE_ID is not configured')
  }
  return process.env.STRIPE_PRO_PRICE_ID
}
