const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const dbPromise = require('../db/db'); // Assumes this is a promise from sqlite.open()

// -------- Authentication Middleware --------
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // User is logged in
  }
  res.redirect('/login'); // Redirect to login if not authenticated
}

// -------- Multer Config --------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Filter allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB limit
});

// -------- Static Serving --------
router.use('/uploads', express.static('public/uploads'));

// -------- Routes --------

// GET /imageupload (protected)
router.get('/imageupload', isAuthenticated, async (req, res) => {
  try {
    const db = await dbPromise;
    const images = await db.all(
      `SELECT path, title, submitted_by FROM images ORDER BY uploaded_at DESC`
    );
    res.render('imageupload', { user: req.session.user, images });
  } catch (err) {
    console.error('Error fetching images:', err);
    res.render('imageupload', { user: req.session.user, images: [] });
  }
});

// POST /imageupload (protected)
router.post('/imageupload', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const db = await dbPromise;
    const userId = req.session.user?.id || 0;
    const title = req.body.title || 'Untitled';
    const imagePath = `/uploads/${req.file.filename}`;
    const submittedBy = req.session.user?.email || 'Anonymous';
    const uploadedAt = new Date().toISOString();

    await db.run(
      `INSERT INTO images (user_id, path, title, submitted_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, imagePath, title, submittedBy, uploadedAt]
    );

    res.redirect('/imageupload');
  } catch (err) {
    console.error('Error saving image:', err);
    res.status(500).send('Error saving image');
  }
});

module.exports = router;


