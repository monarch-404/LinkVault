import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/store';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase securely using environment variables
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

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

  // --- NEW: Cloud Cleanup Helper ---
  // A quick function to wipe the file from the cloud bucket
  const deleteCloudFile = async () => {
    if (meta.type === 'file' && meta.content) {
      const { error } = await supabase.storage.from('vault').remove([meta.content]);
      if (error) console.error("Cloud deletion error:", error);
    }
  };

  // 1. Expiry Check
  if (Date.now() > Number(meta.expires_at)) {
    await deleteCloudFile(); // Wipe from cloud first
    await Store.delete(id);  // Then wipe from DB
    return res.status(410).json({ error: 'Link expired' });
  }

  // 2. View Limit Check
  if (meta.max_views !== null && meta.view_count >= meta.max_views) {
    await deleteCloudFile(); // Wipe from cloud first
    await Store.delete(id);  // Then wipe from DB
    return res.status(410).json({ error: 'View limit reached' });
  }

  // 3. Password Check Logic
  if (meta.password_hash) {
    if (!password) {
      return res.status(403).json({ error: 'Password required', protected: true });
    }
    const match = await bcrypt.compare(password, meta.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password', protected: true });
    }
  }

  // 4. Increment View count in Database
  await Store.incrementView(id);

  // 5. Serve Content (Cloud Download vs Text)
  if (meta.type === 'file') {
    // securely download from private bucket
    const { data, error } = await supabase.storage
      .from('vault')
      .download(meta.content); 

    if (error || !data) {
      console.error("Supabase Download Error:", error);
      return res.status(500).json({ error: 'Failed to retrieve file from cloud' });
    }

    // Convert the cloud Blob into a Node Buffer
    const buffer = Buffer.from(await data.arrayBuffer());

    // Send the buffer to the frontend as a disguised file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.original_name}"`);
    return res.send(buffer);
  } else {
    // It's just text, send it normally
    res.json({ type: 'text', content: meta.content });
  }
};

// 2. Manual Delete
export const deleteContent = async (req: Request<ContentParams>, res: Response) => {
  const { id } = req.params; 
  const { token } = req.body;

  const meta = await Store.getMetadata(id);
  
  // Verify token matches
  if (meta && meta.delete_token === token) {
    
    // --- NEW: Manual Cloud Cleanup ---
    if (meta.type === 'file' && meta.content) {
      const { error } = await supabase.storage.from('vault').remove([meta.content]);
      if (error) console.error("Cloud deletion error:", error);
    }

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
    const history = await Store.getUserHistory((req as any).user.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// 4. Get Link Status (For Live Polling)
export const getStatus = async (req: Request<ContentParams>, res: Response) => {
  const { id } = req.params;
  const token = req.query.token as string; 

  const meta = await Store.getMetadata(id);
  
  if (!meta) {
    return res.status(404).json({ error: 'Content deleted or expired' });
  }

  if (meta.delete_token !== token) {
    return res.status(403).json({ error: 'Unauthorized to view status' });
  }

  res.json({
    view_count: meta.view_count,
    max_views: meta.max_views,
    is_dead: (meta.max_views !== null && meta.view_count >= meta.max_views) || (Date.now() > Number(meta.expires_at))
  });
};