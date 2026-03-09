
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import Stripe from 'stripe';
import User, { IUser } from '../models/User';
import { Buffer } from 'buffer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;

if (!PREMIUM_PRICE_ID) {
  console.error("FATAL: STRIPE_PREMIUM_PRICE_ID is not set in .env. Subscriptions will fail.");
}

// @desc    Create Stripe Checkout Session for subscription
// @route   POST /api/stripe/create-checkout-session
// @access  Private
export const createCheckoutSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const currentReqUser = req.user as IUser | undefined;
  const userId = currentReqUser?.id;
  const user = await User.findById(userId);

  if (!user || !user.stripeCustomerId) {
    res.status(404);
    throw new Error('User or Stripe customer ID not found.');
  }
  if (!PREMIUM_PRICE_ID) {
    res.status(500);
    throw new Error('Subscription service is not configured correctly. Missing Price ID.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/#/subscription?checkout_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/#/subscription?checkout_status=canceled`,
      allow_promotion_codes: true,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout session creation failed:", error);
    res.status(500);
    throw new Error(`Failed to create subscription session: ${error.message}`);
  }
});

// @desc    Create Stripe Customer Portal Session
// @route   POST /api/stripe/customer-portal-session
// @access  Private
export const createCustomerPortalSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const currentReqUser = req.user as IUser | undefined;
    const userId = currentReqUser?.id;
    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
        res.status(404);
        throw new Error('User or Stripe customer ID not found.');
    }

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${FRONTEND_URL}/#/subscription`,
        });
        res.json({ url: portalSession.url });
    } catch (error: any) {
        console.error("Stripe customer portal session creation failed:", error);
        res.status(500);
        throw new Error(`Failed to create customer portal session: ${error.message}`);
    }
});


// @desc    Handle Stripe Webhooks
// @route   POST /api/stripe/webhook
// @access  Public (verified by Stripe signature)
export const handleWebhook = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured.");
    res.status(500).send('Webhook secret not configured.');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.subscription && session.customer) {
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeSubscriptionStatus: subscription.status,
            planType: 'premium',
          },
          { new: true }
        );
        console.log(`Checkout session completed for customer ${customerId}, subscription ${subscriptionId} status: ${subscription.status}`);
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: updatedSubscription.id },
        {
          stripeSubscriptionStatus: updatedSubscription.status,
          stripePriceId: updatedSubscription.items.data[0]?.price.id,
          planType: (updatedSubscription.status === 'active' || updatedSubscription.status === 'trialing') ? 'premium' : 'free',
        },
        { new: true }
      );
      console.log(`Subscription ${updatedSubscription.id} updated to status ${updatedSubscription.status}`);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: deletedSubscription.id },
        {
          stripeSubscriptionStatus: 'canceled',
          planType: 'free',
        },
        { new: true }
      );
      console.log(`Subscription ${deletedSubscription.id} was canceled/deleted.`);
      break;

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
});
