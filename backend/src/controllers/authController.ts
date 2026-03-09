
import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import User, { IUser } from '../models/User';
import generateToken from '../utils/generateToken';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import Stripe from 'stripe';
import sendEmail from '../utils/sendEmail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signupUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation errors", errors: errors.array() });
    return;
  }

  const { name, email, password, role } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Password is required for signup');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  let stripeCustomer;
  try {
    stripeCustomer = await stripe.customers.create({
      email,
      name,
    });
  } catch (stripeError: any) {
    console.error("Stripe customer creation failed:", stripeError);
    res.status(500);
    throw new Error("Failed to create user account (billing setup). Please try again later.");
  }

  const userToSave = new User({
    name,
    email,
    password,
    role: role || 'user',
    stripeCustomerId: stripeCustomer.id,
    planType: 'free',
  });

  const user: IUser = await userToSave.save();

  if (user) {
    const token = generateToken(user.id, user.role);
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        planType: user.planType,
        detectionCount: user.detectionCount,
        stripeCustomerId: user.stripeCustomerId,
      },
      token,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation errors", errors: errors.array() });
    return;
  }

  const { email, password } = req.body;
  if (!password) {
    res.status(400);
    throw new Error('Password is required for login');
  }
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user.id, user.role);
    const userProfile = await User.findById(user.id).select('-password');
    res.json({
      user: {
        id: userProfile?.id,
        name: userProfile?.name,
        email: userProfile?.email,
        role: userProfile?.role,
        planType: userProfile?.planType,
        detectionCount: userProfile?.detectionCount,
        stripeSubscriptionStatus: userProfile?.stripeSubscriptionStatus,
      },
      token,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userFromRequest = req.user as IUser; 

  if (userFromRequest) {
    const user = await User.findById(userFromRequest.id).select('-password');
    if (user) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripePriceId: user.stripePriceId,
        stripeSubscriptionStatus: user.stripeSubscriptionStatus,
        planType: user.planType,
        detectionCount: user.detectionCount,
      });
    } else {
      res.status(404);
      throw new Error('User not found from token ID');
    }
  } else {
    res.status(404); 
    throw new Error('User not found in request (authentication issue)');
  }
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation errors", errors: errors.array() });
    return;
  }

  const { email } = req.body;
  const user = await User.findOne({ email });

  const successMessage = 'If an account with that email exists, we have sent password reset instructions to it.';
  
  if (!user) {
    res.status(200).json({ message: successMessage });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/#/reset-password/${resetToken}`;

  const messageBody = `
    <p>You are receiving this email because you (or someone else) has requested the reset of a password for your Green Shield account.</p>
    <p>Please click on the following link, or paste it into your browser to complete the process within one hour of receiving it:</p>
    <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Green Shield - Password Reset Request',
      html: messageBody,
      text: `Reset your Green Shield password by visiting: ${resetUrl}`
    });
    res.status(200).json({ message: successMessage });
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false }); // Save without validation to clear tokens
    res.status(500).json({ message: 'There was an error sending the email. Please try again later.' });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: "Validation errors", errors: errors.array() });
    return;
  }

  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token.');
  }

  user.password = req.body.password;
  if (!user.password) {
    res.status(400);
    throw new Error('New password is required');
  }
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
  res.status(200).json({ message: 'Password reset successful. You can now log in.' });
});
