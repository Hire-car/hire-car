# Stripe Billing Setup

## Required Stripe prices

Create recurring prices in Stripe Dashboard (live and test):

| Env variable | Plan | Amount |
|--------------|------|--------|
| `STRIPE_PRICE_STARTER` | Starter monthly | $20 AUD |
| `STRIPE_PRICE_STARTER_ANNUAL` | Starter annual | $216 AUD |
| `STRIPE_PRICE_GROWTH` | Growth monthly | $49 AUD |
| `STRIPE_PRICE_GROWTH_ANNUAL` | Growth annual | $529 AUD |
| `STRIPE_PRICE_PRO` | Pro monthly | $99 AUD |
| `STRIPE_PRICE_PRO_ANNUAL` | Pro annual | $1069 AUD |

## Customer Portal

1. Stripe Dashboard → Settings → Billing → Customer portal
2. Enable subscription management (cancel, switch plans)
3. Enable payment method updates

## No Free Trials Policy

- Hire Car Marketplace does not offer free trials on any subscription plan (Starter, Growth, Pro).
- All six plans are paid recurring plans requiring upfront card authorization (`payment_method_collection: "always"`).
- Zero-dollar checkouts, unverified trials, and trial-based entitlements are strictly rejected.

## Webhook

Endpoint: `https://www.hirecarmarketplace.com.au/api/stripe/webhook`

Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

## Vercel env vars

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_GROWTH_ANNUAL=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
```
