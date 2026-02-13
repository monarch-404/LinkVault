import { Router } from 'express';
import multer from 'multer';
import { register, login } from '../controllers/auth.controller';
import { uploadContent } from '../controllers/upload.controller'; // Update import
import { getContent, deleteContent, getHistory } from '../controllers/content.controller'; // Update import
import { authenticate } from '../middleware/auth';

const router = Router();

// Feature: File Validation (Max 5MB, Restricted Types)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|txt|pdf|zip)$/)) {
      return cb(new Error('File type not allowed!'));
    }
    cb(null, true);
  }
});

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Upload (Protected by Auth Middleware)
router.post('/upload', authenticate, upload.single('file'), uploadContent);

// Content
router.post('/content/:id', getContent); // POST to accept password
router.delete('/content/:id', deleteContent);

// User History
router.get('/user/history', authenticate, getHistory);

export default router;