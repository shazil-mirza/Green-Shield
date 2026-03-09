
import express, { RequestHandler } from 'express'; 
import {
  signupUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { body, param, ValidationChain } from 'express-validator';

const router = express.Router();

const signupValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[A-Za-z\s.'-]+$/).withMessage('Name can only contain letters, spaces, and basic punctuation.'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role specified.'),
];

const loginValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required'),
];

const forgotPasswordValidation: ValidationChain[] = [
  body('email').isEmail().withMessage('Please enter a valid email'),
];

const resetPasswordValidation: ValidationChain[] = [
  param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Token format is invalid.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

router.post('/signup', ...signupValidation, signupUser);
router.post('/login', ...loginValidation, loginUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', ...forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', ...resetPasswordValidation, resetPassword);

export default router;
