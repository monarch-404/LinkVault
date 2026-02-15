import { Request, Response } from 'express';
import { Store } from '../models/store';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadContent = async (req: Request, res: Response) => {
  try {
    const { text, expiry, password, maxViews } = req.body;
    const file = req.file;

    if (!text && !file) {
      return res.status(400).json({ error: 'Provide text or a file' });
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Safety fallback for expiry
    const expiryMinutes = expiry ? Number(expiry) : 60;
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
    const maxViewsNum = maxViews ? Number(maxViews) : null;
    const userId = (req as any).user?.id || null;

    let contentData = '';
    let originalName = null;
    let type = 'text';

    // --- CLOUD UPLOAD LOGIC ---
    if (file) {
      type = 'file';
      originalName = file.originalname;
      
      // We still need a random string just to ensure the Supabase filename is unique!
      const uniqueCloudId = crypto.randomBytes(4).toString('hex');
      const cloudFileName = `${uniqueCloudId}-${originalName}`;
      
      const { error } = await supabase.storage
        .from('vault')
        .upload(cloudFileName, file.buffer, {
          contentType: file.mimetype
        });

      if (error) {
        console.error("Supabase Upload Error:", error);
        return res.status(500).json({ error: 'Failed to upload to cloud' });
      }

      contentData = cloudFileName; 
    } else {
      contentData = text;
    }

    // --- THE MAGIC FIX ---
    // We let your Model generate the real ID and Token, and we CAPTURE the result!
    const result = await Store.createUpload({
      type: type as 'text' | 'file',
      content: contentData,
      originalName: originalName,
      passwordHash: passwordHash,
      expiresAt: expiresAt,
      maxViews: maxViewsNum,
      userId: userId
    });

    // We send the REAL Database ID and Token to the frontend!
    res.json({ id: result.id, delete_token: result.deleteToken });
    
  } catch (err: any) {
    console.error("\n❌ [CRITICAL CRASH IN UPLOAD]:", err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};