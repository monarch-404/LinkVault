import { Router } from 'express';
import multer from 'multer';
import { register, login } from '../controllers/auth.controller';
import { uploadContent } from '../controllers/upload.controller'; // Update import
import { getContent, deleteContent, getHistory, getStatus } from '../controllers/content.controller';
// 1. Import BOTH middlewares
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Feature: File Validation (Max 10MB, Restricted Types)
const upload = multer({
  storage: multer.memoryStorage(), // Holds the file in RAM temporarily!
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// 2. THE FIX: Use optionalAuth here so anonymous users can still upload!
router.post('/upload', optionalAuth, upload.single('file'), uploadContent);

// Content
router.post('/content/:id', getContent); // POST to accept password
router.delete('/content/:id', deleteContent);
router.get('/content/:id/status', getStatus); // <-- ADD THIS NEW LINE

// User History
router.get('/user/history', authenticate, getHistory);

export default router;