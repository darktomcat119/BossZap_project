# BossZap — Payments & Monetization

## Landing Page
- Professional, responsive, mobile-first, conversion-optimized.
- Hero: bold headline, subtitle, CTA ("Empieza Gratis" / "Start Free" / "Comece Gratis").
- Features section: 3-4 blocks with icons.
- How it works: 3-step visual (1. Talk on WhatsApp → 2. AI handles everything → 3. See your Dashboard).
- Pricing: plan card with price, features, CTA.
- Language switcher in header.
- Footer: links, contact, legal.
- Lighthouse score: 90+ on all metrics.

## Payment Gateway
- Stripe or Pagar.me.
- Methods: Credit card + Pix (Brazilian instant payment).
- Webhook events: payment_success, payment_failed, subscription_cancelled, subscription_renewed.
- Verify webhook signatures on every event.

## Subscription Flow
1. User visits landing page → clicks CTA.
2. Registration form: name, email, phone, password.
3. Select plan (if multiple) or default plan.
4. Enter credit card (required even for trial).
5. Start 7-day free trial.
6. After trial: automatic first charge.
7. Monthly recurring billing.

## Automated Access Control
| Payment Status | Subscriber Status | Access |
|---|---|---|
| Trial active | `trialing` | Full access |
| Payment succeeded | `active` | Full access |
| Payment failed | `active` → grace 3 days → `suspended` | Blocked after grace |
| Subscription cancelled | `cancelled` | Blocked immediately |

## Sales Recovery via WhatsApp (CRITICAL)
When payment fails:
1. Day 0: First friendly reminder with payment link.
2. Day 2: Second reminder if still unpaid.
3. Day 3: Final warning — access will be suspended.

Recovery message sending strategy:
- Check subscriber's 24h window status FIRST.
- Window OPEN → send as regular message (free).
- Window CLOSED → send via HSM template (has cost, but P1 priority).

Recovery messages must be:
- Friendly and non-aggressive.
- In the subscriber's preferred language.
- Include a direct payment link.
- Never threaten or use urgent/alarming language.

## Data After Cancellation
- Data retained for 90 days.
- After 90 days: archived to cold storage (S3).
- After 1 year: permanently deleted.
- Subscriber can request data export before deletion.
