
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import User, { IUser } from '../models/User';
import Detection from '../models/Detection';
import Stripe from 'stripe';
import { validationResult } from 'express-validator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});


// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc    Get user by ID (Admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user by admin
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUserByAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ message: "Validation errors", errors: errors.array() });
        return;
    }
  
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const { name, email, role } = req.body;
    
    const adminUser = req.user as IUser;
    if (adminUser.id === user.id && role && role !== 'admin') {
        res.status(400);
        throw new Error('Administrators cannot demote their own account.');
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    const updatedUser = await user.save();

    res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
    });
});


// @desc    Delete user by admin
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUserByAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    const adminUser = req.user as IUser;
    if (adminUser.id === user.id) {
        res.status(400);
        throw new Error('Administrators cannot delete their own account.');
    }

    // If user has an active Stripe subscription, cancel it
    if (user.stripeSubscriptionId) {
        try {
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            if (subscription.status !== 'canceled') {
                await stripe.subscriptions.cancel(user.stripeSubscriptionId);
                console.log(`Canceled Stripe subscription ${user.stripeSubscriptionId} for deleted user ${user.email}`);
            }
        } catch (stripeError: any) {
            console.error(`CRITICAL: Failed to cancel Stripe subscription ${user.stripeSubscriptionId} for user ${user.email}. Manual cancellation required. Error: ${stripeError.message}`);
        }
    }
    
    await Detection.deleteMany({ user: user._id });

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User and all associated data deleted successfully.' });
});


// @desc    Get detection analytics (Admin only)
// @route   GET /api/admin/analytics/detections
// @access  Private/Admin
export const getDetectionAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const totalDetections = await Detection.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const detectionsPerDisease = await Detection.aggregate([
        { $group: { _id: "$diseaseName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, diseaseName: "$_id", count: 1 } }
    ]);
    
    const detectionsPerDiseaseMap = detectionsPerDisease.reduce((acc, item) => {
        acc[item.diseaseName] = item.count;
        return acc;
    }, {});

    res.json({
        totalDetections,
        totalUsers,
        detectionsPerDisease: detectionsPerDiseaseMap
    });
});

// @desc    Get subscription analytics (Admin only)
// @route   GET /api/admin/analytics/subscriptions
// @access  Private/Admin
export const getSubscriptionStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const totalActivePremiumSubscribers = await User.countDocuments({
        planType: 'premium',
        stripeSubscriptionStatus: { $in: ['active', 'trialing'] }
    });
    
    // In a real app, you might calculate MRR, churn, etc. here, likely querying Stripe API.
    
    res.json({
        totalActivePremiumSubscribers
    });
});
