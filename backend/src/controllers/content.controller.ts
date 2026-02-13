import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/store';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

// Define the expected shape of the URL parameters
interface ContentParams {
  id: string;
}

// 1. Get Content
export const getContent = async (req: Request<ContentParams>, res: Response) => {
  const { id } = req.params; // TypeScript now knows 'id' is a string
  const { password } = req.body;
  
  const meta = await Store.getMetadata(id);

  if (!meta) {
    return res.status(404).json({ error: 'Content not found' });
  }

  // Check Expiry
  if (Date.now() > Number(meta.expires_at)) {
    await Store.delete(id);
    return res.status(410).json({ error: 'Link expired' });
  }

  // Check Max Views (One-Time View)
  if (meta.max_views !== null && meta.view_count >= meta.max_views) {
    await Store.delete(id);
    return res.status(410).json({ error: 'View limit reached. Content deleted.' });
  }

  // Check Password
  if (meta.password_hash) {
    if (!password) {
      return res.status(403).json({ error: 'Password required', protected: true });
    }
    const match = await bcrypt.compare(password, meta.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password', protected: true });
    }
  }

  // Success: Increment View
  await Store.incrementView(id);

  if (meta.type === 'file') {
    // Safety check for file existence
    if (fs.existsSync(meta.content)) {
       res.download(path.resolve(meta.content), meta.original_name);
    } else {
       res.status(410).json({ error: 'File missing from server' });
    }
  } else {
    res.json({ type: 'text', content: meta.content });
  }
};

// 2. Manual Delete
export const deleteContent = async (req: Request<ContentParams>, res: Response) => {
  const { id } = req.params; // TypeScript now knows 'id' exists
  const { token } = req.body;

  const meta = await Store.getMetadata(id);
  
  // Verify token matches
  if (meta && meta.delete_token === token) {
    await Store.delete(id);
    res.json({ success: true, message: 'Content deleted successfully' });
  } else {
    res.status(403).json({ error: 'Invalid delete token or ID not found' });
  }
};

// 3. User History
export const getHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  
  try {
    const history = await Store.getUserHistory(req.user.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};