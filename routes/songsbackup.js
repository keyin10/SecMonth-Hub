const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db/db'); // use same db import style as imageupload.js

// -------- Authentication Middleware --------
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

// -------- Multer Config --------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Allow only MP3 files
const fileFilter = (req, file, cb) => {
  if (
    path.extname(file.originalname).toLowerCase() === '.mp3' &&
    file.mimetype === 'audio/mpeg'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only MP3 files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB
});

// -------- Static Serving --------
router.use('/uploads', express.static('public/uploads'));

// -------- Routes --------

// GET /aisongs (with pagination & validation)
router.get('/aisongs', isAuthenticated, (req, res) => {
  const limit = 5; // songs per page
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * limit;

  db.get('SELECT COUNT(*) AS total FROM aisongs', (err, row) => {
    if (err) {
      console.error('Error counting songs:', err);
      return res.render('aisongs', {
        user: req.session.user,
        songs: [],
        error: 'Error fetching songs',
        currentPage: 1,
        totalPages: 1
      });
    }

    const totalSongs = row.total;
    const totalPages = Math.max(1, Math.ceil(totalSongs / limit));
    const safePage = Math.min(page, totalPages);
    const safeOffset = (safePage - 1) * limit;

    db.all(
      'SELECT path, title, submitted_by FROM aisongs ORDER BY uploaded_at DESC LIMIT ? OFFSET ?',
      [limit, safeOffset],
      (err2, rows) => {
        if (err2) {
          console.error('Error fetching songs:', err2);
          return res.render('aisongs', {
            user: req.session.user,
            songs: [],
            error: 'Error fetching songs',
            currentPage: 1,
            totalPages: 1
          });
        }

        res.render('aisongs', {
          user: req.session.user,
          songs: rows,
          currentPage: safePage,
          totalPages
        });
      }
    );
  });
});

// POST /aisongs
router.post('/aisongs', isAuthenticated, upload.single('song'), (req, res) => {
  const sqlSelect = `SELECT path, title, submitted_by FROM aisongs ORDER BY uploaded_at DESC`;

  if (!req.file) {
    return db.all(sqlSelect, [], (err, rows) => {
      res.render('aisongs', {
        user: req.session.user,
        songs: rows || [],
        error: 'No file uploaded',
        currentPage: 1,
        totalPages: 1
      });
    });
  }

  const userId = req.session.user?.id || 0;
  const title = req.body.title || 'Untitled';
  const songPath = `/uploads/${req.file.filename}`;
  const submittedBy = req.session.user?.email || 'Anonymous';
  const uploadedAt = new Date().toISOString();

  const insertSql = `
    INSERT INTO aisongs (user_id, path, title, submitted_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(insertSql, [userId, songPath, title, submittedBy, uploadedAt], (err) => {
    if (err) {
      console.error('Error saving song:', err);
      return db.all(sqlSelect, [], (err2, rows) => {
        res.render('aisongs', {
          user: req.session.user,
          songs: rows || [],
          error: 'Error saving song',
          currentPage: 1,
          totalPages: 1
        });
      });
    }

    // Redirect back to page 1 after upload
    res.redirect('/aisongs?page=1');
  });
});

module.exports = router;

