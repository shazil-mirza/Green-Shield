
import express, { Request, Response, NextFunction } from 'express'; 
import asyncHandler from 'express-async-handler';

const router = express.Router();

// @desc    Get Stripe configuration (publishable key and premium price ID)
// @route   GET /api/config/stripe
// @access  Public
const getStripeConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => { 
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;

  if (!publishableKey || !premiumPriceId) {
    console.error("Stripe config missing: Publishable Key or Premium Price ID not set in .env");
    res.status(500).json({ message: "Server configuration error for payments." });
    return;
  }
  res.json({
    publishableKey,
    premiumPriceId
  });
});

router.get('/stripe', getStripeConfig); 

export default router;
