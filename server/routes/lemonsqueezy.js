const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const crypto  = require('crypto');

const LS_API_KEY       = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID      = process.env.LEMONSQUEEZY_STORE_ID;
const LS_VARIANT_MONTHLY = process.env.LEMONSQUEEZY_VARIANT_MONTHLY; // variant ID from dashboard
const LS_VARIANT_YEARLY  = process.env.LEMONSQUEEZY_VARIANT_YEARLY;
const LS_WEBHOOK_SECRET  = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const APP_URL          = process.env.APP_URL      || 'https://app.fortly.xyz';
const FRONTEND_URL     = process.env.FRONTEND_URL || 'https://fortly.vercel.app';

const lsHeaders = {
  Authorization: `Bearer ${LS_API_KEY}`,
  'Content-Type': 'application/vnd.api+json',
  Accept: 'application/vnd.api+json'
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lemonsqueezy/create-checkout
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-checkout', async (req, res) => {
  const { email, name, billingPeriod } = req.body;

  if (!email || !name || !billingPeriod) {
    return res.status(400).json({ message: 'email, name and billingPeriod are required' });
  }

  const variantId = billingPeriod === 'yearly' ? LS_VARIANT_YEARLY : LS_VARIANT_MONTHLY;

  if (!variantId) {
    return res.status(500).json({ message: 'Lemon Squeezy variant ID not configured' });
  }

  try {
    const response = await axios.post(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        data: {
          type: 'checkouts',
          attributes: {
            // Pre-fill customer info
            checkout_data: {
              email,
              name,
              custom: {
                // Passed back in webhook so we can find the business
                user_email:     email,
                billing_period: billingPeriod
              }
            },
            // Redirect URLs
            checkout_options: {
              dark:           false,
              success_url:    `${APP_URL}/business/payment-success?email=${encodeURIComponent(email)}&plan=${billingPeriod}`,
            },
            // Override product URL cancel behavior
            product_options: {
              redirect_url:    `${APP_URL}/business/payment-success?email=${encodeURIComponent(email)}&plan=${billingPeriod}`,
              receipt_link_url: APP_URL,
              receipt_thank_you_note: 'Thank you for subscribing to Fortly Pro! Head back to your dashboard to get started.'
            },
            // Trial period — 30 days free
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          relationships: {
            store: {
              data: { type: 'stores', id: String(LS_STORE_ID) }
            },
            variant: {
              data: { type: 'variants', id: String(variantId) }
            }
          }
        }
      },
      { headers: lsHeaders }
    );

    const checkoutUrl = response.data.data.attributes.url;
    res.json({ checkoutUrl });

  } catch (error) {
    console.error('Lemon Squeezy checkout error:', error.response?.data || error.message);
    const detail = error.response?.data?.errors?.[0]?.detail;
    res.status(500).json({ message: detail || 'Failed to create checkout' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lemonsqueezy/webhook
// Register URL in Lemon Squeezy Dashboard → Settings → Webhooks
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // ── Verify signature ──
  const secret    = LS_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];
  const body      = req.body.toString();

  if (secret && signature) {
    const hmac     = crypto.createHmac('sha256', secret);
    const digest   = hmac.update(body).digest('hex');
    if (digest !== signature) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }
  }

  const db      = require('../config/database');
  const payload = JSON.parse(body);
  const event   = payload.meta?.event_name;
  const data    = payload.data;

  console.log('🍋 Lemon Squeezy webhook:', event);

  try {
    switch (event) {

      // ── Subscription created (trial starts) ──
      case 'subscription_created': {
        const attrs        = data.attributes;
        const email        = attrs.user_email;
        const billingPeriod = attrs.variant_name?.toLowerCase().includes('year') ? 'yearly' : 'monthly';
        const trialEndsAt  = attrs.trial_ends_at ? new Date(attrs.trial_ends_at) : null;

        const business = await db.Business.findOne({ where: { email } });
        if (business) {
          await business.update({
            subscriptionStatus: 'trial',
            subscriptionPlan:   billingPeriod,
            trialEndsAt:        trialEndsAt || business.trialEndsAt
          });
          console.log(`✅ Trial started for ${email}`);
        }
        break;
      }

      // ── Payment succeeded (trial ended, subscription active) ──
      case 'subscription_payment_success': {
        const attrs   = data.attributes;
        const email   = attrs.user_email;
        const billing = attrs.variant_name?.toLowerCase().includes('year') ? 'yearly' : 'monthly';

        const business = await db.Business.findOne({ where: { email } });
        if (business) {
          const now     = new Date();
          const endDate = new Date(now);
          billing === 'yearly'
            ? endDate.setFullYear(endDate.getFullYear() + 1)
            : endDate.setMonth(endDate.getMonth() + 1);

          await business.update({
            subscriptionStatus:   'active',
            subscriptionPlan:      billing,
            subscriptionStartDate: now,
            subscriptionEndDate:   endDate,
            isPaused:              false
          });
          console.log(`✅ Subscription active for ${email} (${billing})`);
        }
        break;
      }

      // ── Payment failed ──
      case 'subscription_payment_failed': {
        const email = data.attributes.user_email;
        const business = await db.Business.findOne({ where: { email } });
        if (business) {
          await business.update({ subscriptionStatus: 'paused' });
          console.log(`❌ Payment failed for ${email}`);
        }
        break;
      }

      // ── Subscription cancelled ──
      case 'subscription_cancelled': {
        const email = data.attributes.user_email;
        const business = await db.Business.findOne({ where: { email } });
        if (business) {
          await business.update({
            subscriptionStatus: 'cancelled',
            subscriptionPlan:   'free'
          });
          console.log(`🚫 Subscription cancelled for ${email}`);
        }
        break;
      }

      // ── Subscription resumed after pause ──
      case 'subscription_resumed': {
        const email = data.attributes.user_email;
        const business = await db.Business.findOne({ where: { email } });
        if (business) {
          await business.update({ subscriptionStatus: 'active', isPaused: false });
          console.log(`▶️  Subscription resumed for ${email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled LS event: ${event}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }

  res.json({ received: true });
});

module.exports = router;