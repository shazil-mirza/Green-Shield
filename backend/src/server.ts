
// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path'; // For resolving .env path
const envPath = path.resolve((process as any).cwd(), '../.env'); // Use process.cwd() directly
dotenv.config({ path: envPath });

// --- DEBUGGING START ---
console.log(`[SERVER START] Attempting to load .env file from: ${envPath}`);
console.log(`[SERVER START] process.env.NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[SERVER START] process.env.PORT: ${process.env.PORT}`);
console.log(`[SERVER START] process.env.API_KEY (Gemini): ${process.env.API_KEY ? 'Loaded' : 'NOT LOADED'}`);
console.log(`[SERVER START] process.env.STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'Loaded' : 'NOT LOADED'}`);
console.log(`[SERVER START] process.env.STRIPE_PUBLISHABLE_KEY: ${process.env.STRIPE_PUBLISHABLE_KEY ? 'Loaded' : 'NOT LOADED'}`);
console.log(`[SERVER START] process.env.STRIPE_PREMIUM_PRICE_ID: ${process.env.STRIPE_PREMIUM_PRICE_ID ? 'Loaded' : 'NOT LOADED'}`);
console.log(`[SERVER START] process.env.STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'Loaded' : 'NOT LOADED'}`);
console.log(`[SERVER START] process.env.MONGO_URI: ${process.env.MONGO_URI ? 'Loaded (partially hidden for security)' : 'NOT LOADED'}`);
// --- DEBUGGING END ---


// Now import other modules
import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import cors from 'cors';
import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/errorMiddleware';

// Import routes
import authRoutes from './routes/authRoutes';
import detectionRoutes from './routes/detectionRoutes';
import adminRoutes from './routes/adminRoutes';
import configRoutes from './routes/configRoutes';

// Import controllers for direct use (Stripe routes)
import { handleWebhook, createCheckoutSession, createCustomerPortalSession } from './controllers/stripeController';
import { protect } from './middleware/authMiddleware';


// Connect to Database
connectDB();

const app: Express = express();

// CORS Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Stripe Webhook Endpoint - Must be before express.json() to get raw body
app.post(
  '/api/stripe/webhook',
  express.raw({type: 'application/json'}),
  handleWebhook
);


// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads
const uploadsPath = path.resolve((process as any).cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(`[SERVER START] Created uploads directory at: ${uploadsPath}`);
}
app.use('/uploads', express.static(uploadsPath));


// Basic Route for testing
app.get('/api', (req: Request, res: Response) => {
  res.send('Green Shield API is running...');
});

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/admin', adminRoutes);

// Mount remaining Stripe routes (those needing JSON parsing)
const otherStripeRouter = express.Router();
otherStripeRouter.post(
  '/create-checkout-session',
  protect, 
  createCheckoutSession
);
otherStripeRouter.post(
  '/customer-portal-session',
  protect, 
  createCustomerPortalSession
);
app.use('/api/stripe', otherStripeRouter);

app.use('/api/config', configRoutes);


// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Frontend URL (for CORS, Stripe redirects): ${process.env.FRONTEND_URL}`);
  console.log(`Uploads directory served from: ${uploadsPath}`);
});
