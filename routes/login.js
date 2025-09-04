const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db/db');

// GET /login - show login form
router.get('/', (req, res) => {
  res.render('login', { error: null, email: '' });
});

// POST /login - process login form
router.post('/', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required.', email });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.get(sql, [email], async (err, user) => {
    if (err) {
      return res.render('login', { error: 'Database error.', email });
    }

    if (!user) {
      return res.render('login', { error: 'Invalid email or password.', email });
    }

    // Compare hashed passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { error: 'Invalid email or password.', email });
    }

    // Login successful - set session user including last_wordle_played
    req.session.user = {
      id: user.id,
      email: user.email,
      points: user.points || 0,
      last_wordle_played: user.last_wordle_played || null
    };

    // Redirect to dashboard or home page
    res.redirect('/');
  });
});

module.exports = router;

