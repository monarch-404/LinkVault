import express from 'express';
import cors from 'cors';
import router from './routes';
import { Store } from './models/store';

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
setInterval(() => {
  Store.deleteExpired();
}, 60000);

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