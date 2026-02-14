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
  const { id } = req.params;
  const { password } = req.body;
  
  const meta = await Store.getMetadata(id);
  if (!meta) return res.status(404).json({ error: 'Content not found' });

  // 1. Expiry Check
  if (Date.now() > Number(meta.expires_at)) {
    await Store.delete(id);
    return res.status(410).json({ error: 'Link expired' });
  }

  // 2. View Limit Check (MOVED UP!)
  // If the limit is already reached, delete it and block access immediately.
  if (meta.max_views !== null && meta.view_count >= meta.max_views) {
    await Store.delete(id);
    return res.status(410).json({ error: 'View limit reached' });
  }

  // 3. Password Check Logic (MOVED DOWN)
  // Now it only asks for a password if the link is actually still valid.
  if (meta.password_hash) {
    if (!password) {
      return res.status(403).json({ error: 'Password required', protected: true });
    }
    const match = await bcrypt.compare(password, meta.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password', protected: true });
    }
  }

  // 4. Increment and Serve
  await Store.incrementView(id);

  if (meta.type === 'file') {
    res.download(path.resolve(meta.content), meta.original_name);
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

// 4. Get Link Status (For Live Polling)
export const getStatus = async (req: Request<ContentParams>, res: Response) => {
  const { id } = req.params;
  const token = req.query.token as string; // We pass the token in the URL

  const meta = await Store.getMetadata(id);
  
  if (!meta) {
    return res.status(404).json({ error: 'Content deleted or expired' });
  }

  // Security Check: Only the creator (who has the delete token) can check the status
  if (meta.delete_token !== token) {
    return res.status(403).json({ error: 'Unauthorized to view status' });
  }

  res.json({
    view_count: meta.view_count,
    max_views: meta.max_views,
    is_dead: (meta.max_views !== null && meta.view_count >= meta.max_views) || (Date.now() > Number(meta.expires_at))
  });
};