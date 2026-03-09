
import express, { RequestHandler } from 'express'; 
import {
    getAllUsers,
    getUserById,
    updateUserByAdmin,
    deleteUserByAdmin,
    getDetectionAnalytics,
    getSubscriptionStats
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';
import { body, param, ValidationChain } from 'express-validator';

const router = express.Router();

const updateUserValidation: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters if provided.'),
  body('email').optional().isEmail().withMessage('Provide a valid email if updating.'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either "user" or "admin".')
];

router.use(protect); 
router.use(authorize(['admin']));

router.route('/users')
    .get(getAllUsers);

router.route('/users/:id')
    .get(getUserById)
    .put(...updateUserValidation, updateUserByAdmin)
    .delete(deleteUserByAdmin);

router.get('/analytics/detections', getDetectionAnalytics);
router.get('/analytics/subscriptions', getSubscriptionStats);

export default router;
