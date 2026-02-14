import { Router } from 'express';
import multer from 'multer';
import { register, login } from '../controllers/auth.controller';
import { uploadContent } from '../controllers/upload.controller'; // Update import
import { getContent, deleteContent, getHistory, getStatus } from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Feature: File Validation (Max 10MB, Restricted Types)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Upload (Protected by Auth Middleware)
router.post('/upload', authenticate, upload.single('file'), uploadContent);

// Content
router.post('/content/:id', getContent); // POST to accept password
router.delete('/content/:id', deleteContent);
router.get('/content/:id/status', getStatus); // <-- ADD THIS NEW LINE

// User History
router.get('/user/history', authenticate, getHistory);

export default router;