import { Router } from 'express';
import multer from 'multer';
import { uploadContent } from '../controllers/upload.controller'; // Ensure these exist
import { getContent } from '../controllers/content.controller';
import { Store } from '../models/store'; // Import Store

const router = Router();
const upload = multer({ dest: 'uploads/' }); 

// Define your endpoints here
router.post('/upload', upload.single('file'), uploadContent);
router.get('/content/:id', getContent);

// THis is for checking what I have sent on the server when I did not have a database but rather a dummy store.Can be removed later
// --- ADD THIS DEBUG ROUTE ---
router.get('/debug', async (req, res) => {
  const allData = await Store.getAll();
  res.json({
    count: allData.length,
    data: allData
  });
});


// CRITICAL: You must export default here for the import to work
export default router;