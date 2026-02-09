import { Request, Response } from 'express';
import { Store } from '../models/store';

export const uploadContent = async (req: Request, res: Response) => {
  try {
    // Debug logging to see exactly what the frontend sends
    console.log("--- New Upload Request ---");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    // Multer parses FormData, so 'text' and 'expirySeconds' are in req.body
    const { text, expirySeconds } = req.body;
    const file = req.file;

    // 1. Validation: Ensure we have at least one type of content
    // We check if 'text' is empty string AND 'file' is undefined
    if ((!text || text.trim() === "") && !file) {
      return res.status(400).json({ 
        error: 'Payload missing. Please upload a file or enter text.' 
      });
    }

    // 2. Expiry Logic (Converted to Seconds)
    // Default to 600 seconds (10 minutes) if no custom time provided
    const seconds = expirySeconds ? parseInt(expirySeconds) : 600;
    const duration = seconds * 1000; // Convert to milliseconds
    const expiresAt = Date.now() + duration;

    let contentId: string;

    // 3. Store the Content
    if (file) {
      // Handle File Upload
      contentId = await Store.create({
        type: 'file',
        content: file.path, // Storing local path (simulating DB/Cloud URL)
        originalName: file.originalname,
        createdAt: Date.now(),
        expiresAt
      });
    } else {
      // Handle Text Upload
      contentId = await Store.create({
        type: 'text',
        content: text, 
        createdAt: Date.now(),
        expiresAt
      });
    }

    // 4. Generate Response
    // Ensure this matches your frontend port (5173 by default)
    const shareableLink = `http://localhost:5173/v/${contentId}`;
    
    console.log(`Success! Generated link: ${shareableLink}`);
    console.log(`Expires in: ${seconds} seconds`);

    res.status(201).json({ 
      link: shareableLink, 
      expiresAt,
      message: 'Upload successful' 
    });

  } catch (error) {
    console.error("Upload Controller Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};