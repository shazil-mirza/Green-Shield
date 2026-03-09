
import express, { RequestHandler } from 'express';
import { 
    handleWebhook,
    // createCheckoutSession and createCustomerPortalSession are now added directly in server.ts
    // to ensure they are placed *after* express.json() middleware for body parsing,
    // while the webhook needs to be before it for raw body.
} from '../controllers/stripeController';
// import { protect } from '../middleware/authMiddleware'; // Protect applied in server.ts for non-webhook routes
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Stripe Webhook - Needs raw body. The express.raw middleware is applied in server.ts.
// This route definition is for logical grouping if this router were to be used,
// but server.ts now defines the webhook route directly.
// router.post('/webhook', asyncHandler(handleWebhook)); // This line isn't active if server.ts handles it directly.


// Other Stripe routes like /create-checkout-session and /customer-portal-session
// are defined in server.ts to ensure they are registered *after* the global express.json() middleware.
// This is because they expect JSON bodies, unlike the webhook.

export default router;