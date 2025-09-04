const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db/db'); // <-- use same db import as app.js

// -------- Authentication Middleware --------
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // User is logged in
  }
  res.redirect('/login'); // Redirect if not authenticated
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
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB
});

// -------- Static Serving --------
router.use('/uploads', express.static('public/uploads'));

// -------- Routes --------

// GET /imageupload (protected)
router.get('/', isAuthenticated, (req, res) => {
  const user = req.session.user;

  const sql = `SELECT path, title, submitted_by FROM images ORDER BY uploaded_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching images:', err);
      return res.render('imageupload', { user, images: [] });
    }

    res.render('imageupload', { user, images: rows });
  });
});

// POST /imageupload (protected)
router.post('/', isAuthenticated, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const userId = req.session.user?.id || 0;
  const title = req.body.title || 'Untitled';
  const imagePath = `/uploads/${req.file.filename}`;
  const submittedBy = req.session.user?.email || 'Anonymous';
  const uploadedAt = new Date().toISOString();

  const insertSql = `
    INSERT INTO images (user_id, path, title, submitted_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(insertSql, [userId, imagePath, title, submittedBy, uploadedAt], (err) => {
    if (err) {
      console.error('Error saving image:', err);
      return res.status(500).send('Error saving image');
    }

    res.redirect('/imageupload');
  });
});

module.exports = router;

