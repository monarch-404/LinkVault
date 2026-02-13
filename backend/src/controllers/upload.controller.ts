import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/store';
import bcrypt from 'bcrypt';

export const uploadContent = async (req: AuthRequest, res: Response) => {
  try {
    const { text, expiry, password, maxViews } = req.body;
    const file = req.file;

    // Password Hashing (Feature: Password Protection)
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    
    // Duration Logic
    const duration = (expiry ? parseInt(expiry) : 600) * 1000;

    const data = {
      userId: req.user?.id, // Link to User if logged in
      type: file ? 'file' : 'text',
      content: file ? file.path : text,
      originalName: file?.originalname,
      expiresAt: Date.now() + duration,
      passwordHash,
      maxViews: maxViews ? parseInt(maxViews) : null
    };

    const result = await Store.createUpload(data);
    
    // Returns Link + Manual Delete Token
    res.json({ 
      link: `http://localhost:5173/v/${result.id}`, 
      deleteToken: result.deleteToken 
    });

  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
};