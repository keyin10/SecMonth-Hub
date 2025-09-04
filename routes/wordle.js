const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Middleware: ensure user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Hidden server-side word list
const wordList = [
        "phish", "patch", "token", "scans", "spoof", "debug", "proxy", "virus",
        "azure", "risks", "hacks", "bytes", "siems", "alert", "cloud", "dmarc",
        "input", "log4j", "leaks", "email", "admin", "cisos", "nonce", "agent",
        "kyber", "audit", "scams", "cyber", "ports", "watch", "shell"
        ];

// Helper: Get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Helper: Get today's word based on calendar day
function getTodayWord() {
  const day = new Date().getDate(); // 1–31
  return wordList[day - 1] || "token";
}

// GET /wordle
router.get('/', requireLogin, (req, res) => {
  const user = req.session.user;
  const today = getTodayDate();
  const playedToday = user.last_wordle_played === today;

  const targetWord = getTodayWord();
  const dayNumber = new Date().getDate();

  if (playedToday) {
    return res.render('wordle_played', {
      user,
      message: "You've already completed today's Wordle. Come back tomorrow!",
      targetWord,
      dayNumber
    });
  }

  res.render('wordle', {
    user,
    targetWord,
    dayNumber
  });
});

// POST /wordle/submit
router.post('/submit', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const email = req.session.user.email;
  const today = getTodayDate();
  const { won } = req.body;

  db.get(
    `SELECT wordle_attempts, last_wordle_played, points FROM users WHERE email = ?`,
    [email],
    (err, row) => {
      if (err) {
        console.error('DB read error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (row.last_wordle_played === today) {
        return res.status(400).json({ success: false, message: "You've already completed today's Wordle." });
      }

      let attempts = row.wordle_attempts || 0;
      attempts++;

      let pointsAwarded = 0;

      if (won === 'true' || won === true) {
        if (attempts <= 2) pointsAwarded = 50;
        else if (attempts <= 4) pointsAwarded = 25;
        else pointsAwarded = 10;

        db.run(
          `UPDATE users SET
            points = points + ?,
            wordle_attempts = 0,
            last_wordle_played = ?
          WHERE id = ?`,
          [pointsAwarded, today, userId],
          (updateErr) => {
            if (updateErr) {
              console.error('DB update error:', updateErr);
              return res.status(500).json({ success: false, message: 'Could not update score' });
            }

            req.session.user.points += pointsAwarded;
            req.session.user.wordle_attempts = 0;
            req.session.user.last_wordle_played = today;

            return res.json({
              success: true,
              pointsAwarded,
              message: '🎉 Congratulations! You completed today’s Wordle.'
            });
          }
        );
      } else {
        // If this was the 6th and final attempt, lock out
        if (attempts >= 6) {
          db.run(
            `UPDATE users SET wordle_attempts = 0, last_wordle_played = ? WHERE id = ?`,
            [today, userId],
            (attemptErr) => {
              if (attemptErr) {
                console.error('DB update error:', attemptErr);
                return res.status(500).json({ success: false, message: 'Failed to update attempts' });
              }

              req.session.user.wordle_attempts = 0;
              req.session.user.last_wordle_played = today;

              return res.json({
                success: true,
                pointsAwarded: 0,
                message: '💀 Game Over. You used all 6 attempts.'
              });
            }
          );
        } else {
          // Not final attempt, just update counter
          db.run(
            `UPDATE users SET wordle_attempts = ? WHERE id = ?`,
            [attempts, userId],
            (attemptErr) => {
              if (attemptErr) {
                console.error('DB update error:', attemptErr);
                return res.status(500).json({ success: false, message: 'Failed to update attempts' });
              }

              req.session.user.wordle_attempts = attempts;

              return res.json({
                success: true,
                pointsAwarded: 0,
                message: `${6 - attempts} attempts remaining.`
              });
            }
          );
        }
      }
    }
  );
});

module.exports = router;

