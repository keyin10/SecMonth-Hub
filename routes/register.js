const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/db');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
const algorithm = 'aes-256-cbc';

function encryptEmail(email) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(email, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

router.get('/', (req, res) => {
   res.render('register', { error: null, success: null, email: '' });
});

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('register', {
      error: 'Email and password are required.',
      success: null,
      email: email || ''
    });
  }

  // Only allow soti.net emails
  if (!email.endsWith('@soti.net')) {
    return res.render('register', {
      error: 'Please register with a valid @soti.net email address.',
      success: null,
      email
    });
  }

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.render('register', {
          error: 'Database error occurred.',
          success: null,
          email
        });
      }
      if (row) {
        return res.render('register', {
          error: 'Email already registered.',
          success: null,
          email
        });
      }

      // Hash password and insert new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
      db.run(sql, [email, hashedPassword], function(insertErr) {
        if (insertErr) {
          return res.render('register', {
            error: 'Error creating user.',
            success: null,
            email
          });
        }

        // Auto-login: store user info in session
        req.session.user = {
          id: this.lastID,
          email,
          points: 0 // Or initial points if any
        };

        // Redirect to dashboard after successful registration & login
        res.redirect('/');
      });
    });
  } catch (e) {
    res.render('register', {
      error: 'Server error occurred.',
      success: null,
      email
    });
  }
});

module.exports = router;

