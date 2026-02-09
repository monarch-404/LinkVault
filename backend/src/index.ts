import express from 'express';
import cors from 'cors';
import router from './routes';
import { Store } from './models/store'; // Import Store for cleanup

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Allow Frontend
app.use(express.json());

// Routes
app.use('/api', router);

// --- CRON JOB: Cleanup every 60 seconds ---
setInterval(() => {
  Store.deleteExpired();
}, 60 * 1000); 

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`⏰ Cleanup job active (Interval: 60s)`);
});