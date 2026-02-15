import express from 'express';
import cors from 'cors';
import router from './routes';
import { Store } from './models/store';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for the background worker
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 5000;

// 1. CORS: Allow Headers & Credentials explicitly
app.use(cors({ 
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'], // <--- THIS IS THE MAGIC LINE
  credentials: true
}));

// 2. PARSERS: Handle JSON and URL-Encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. DEBUG LOGGER (The X-Ray)
// This will print every request to your terminal
app.use((req, res, next) => {
  console.log(`\n--- INCOMING REQUEST: ${req.method} ${req.url} ---`);
  console.log('Headers:', req.headers['content-type']);
  console.log('Body:', req.body);
  console.log('------------------------------------------------');
  next();
});

// 4. Routes
app.use('/api', router);

// 5. Cleanup Job
// --- AUTOMATED CLOUD GARBAGE COLLECTOR ---
// This runs automatically every 1 hour (60 minutes * 60 seconds * 1000 ms)
setInterval(async () => {
  try {
    // 1. Wipe from PostgreSQL and get the list of orphaned cloud files
    const orphanedFiles = await Store.deleteExpired();
    
    if (orphanedFiles.length > 0) {
      // 2. Extract just the string names into an array: ["file1.jpg", "file2.pdf"]
      const fileNames = orphanedFiles.map(file => file.content);
      
      // 3. Tell Supabase to bulk-delete them all at once
      const { error } = await supabase.storage.from('vault').remove(fileNames);
      
      if (error) {
        console.error("❌ Background Cloud Sweep Failed:", error);
      } else {
        console.log(`✨ Sweeper: Wiped ${fileNames.length} expired files from cloud.`);
      }
    }
  } catch (err) {
    console.error("❌ Garbage Collector Crash:", err);
  }
}, 60 * 1000);

import { NextFunction, Request, Response } from 'express';

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.error("Upload Error:", err.message);
    // Use return here to ensure the function exits
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});