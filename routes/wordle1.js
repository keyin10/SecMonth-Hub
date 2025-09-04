const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Middleware to require login (you might already have this)
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// GET /wordle — show game or message if already played today
router.get('/', requireLogin, (req, res) => {
  const user = req.session.user;
  const today = new Date().toISOString().slice(0, 10);

  if (user.last_wordle_played === today) {
    return res.render('wordle_played', { user });
  }

  res.render('wordle', { user });
});

// POST /wordle/submit — process score submission
router.post('/submit', requireLogin, (req, res) => {
  const { won, attemptCount } = req.body;
  if (!won) return res.json({ pointsAwarded: 0 });

  const today = new Date().toISOString().slice(0, 10);
  const email = req.session.user.email;

  db.get('SELECT last_wordle_played FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }

    if (row && row.last_wordle_played === today) {
      return res.status(400).json({ error: 'You can only play Wordle once per day.' });
    }

    let pointsAwarded = 1;
    if (attemptCount <= 2) pointsAwarded = 50;
    else if (attemptCount <= 4) pointsAwarded = 25;

    const updateSQL = `
      UPDATE users
      SET points = points + ?, last_wordle_played = ?
      WHERE email = ?
    `;
    db.run(updateSQL, [pointsAwarded, today, email], function(err) {
      if (err) {
        console.error('Failed to update points:', err);
        return res.status(500).json({ error: 'Failed to update points' });
      }

      req.session.user.points = (req.session.user.points || 0) + pointsAwarded;
      req.session.user.last_wordle_played = today;

      res.json({ pointsAwarded });
    });
  });
});

module.exports = router;

