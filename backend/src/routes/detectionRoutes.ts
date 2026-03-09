

import express, { Request } from 'express'; 
import {
    createDetection,
    getUserDetections,
    deleteDetection
} from '../controllers/detectionController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) { 
    const uploadDir = path.resolve((process as any).cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) { 
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => { 
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, WEBP images are allowed.') as any; 
    error.code = 'LIMIT_UNEXPECTED_FILE'; 
    cb(error);
  }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

const router = express.Router();

router.route('/')
    .post(
        protect, 
        upload.single('image'),
        createDetection 
    )
    .get(
        protect, 
        getUserDetections 
    );

router.route('/:id')
    .delete(
        protect, 
        deleteDetection 
    );

export default router;
