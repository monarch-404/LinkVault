import { Request, Response } from 'express';
import { Store } from '../models/store';
import path from 'path';
import fs from 'fs';

export const getContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const data = await Store.get(id);

    // 1. Content Not Found (Expired or Invalid ID)
    if (!data) {
      return res.status(404).json({ error: 'Content not found or expired' });
    }

    // 2. Handle Text
    if (data.type === 'text') {
      return res.json({ 
        type: 'text', 
        content: data.content, 
        expiresAt: data.expiresAt 
      });
    } 
    
    // 3. Handle File
    if (data.type === 'file') {
      // SAFETY CHECK: Ensure file actually exists on disk
      if (!fs.existsSync(data.content)) {
        return res.status(410).json({ error: 'File resource is gone (deleted from server).' });
      }

      const downloadName = data.originalName || 'downloaded_file';
      
      // Send file for download
      return res.download(path.resolve(data.content), downloadName, (err) => {
        if (err && !res.headersSent) {
           res.status(500).send('Error downloading file');
        }
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};