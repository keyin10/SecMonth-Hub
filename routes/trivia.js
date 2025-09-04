const express = require('express');
const router = express.Router();
const db = require('../db/db');
const triviaQuestions = require('../data/triviaQuestions.js');

// Middleware: ensure user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Helper: get today's date YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// GET /trivia - show today's trivia if not already played
router.get('/', requireLogin, (req, res) => {
  const user = req.session.user;
  const today = getTodayDate();
  const question = triviaQuestions[today];

  if (!question) {
    return res.send("No trivia available today.");
  }

  // Check if already played
  const playedToday = user.last_trivia_date === today;

  if (playedToday) {
    return res.render('trivia_played', {
      user,
      success: null,
      message: "You have already played today's trivia."
    });
  }

  res.render('trivia', {
    user,
    question
  });
});

// POST /trivia - submit answer
router.post('/submit', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const email = req.session.user.email;
  const today = getTodayDate();
  const { answer } = req.body;
  const question = triviaQuestions[today];

  if (!question) return res.send("No trivia available today.");

  db.get(
    `SELECT points, last_trivia_date FROM users WHERE email = ?`,
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (!row) return res.status(404).json({ success: false, message: 'User not found' });

      if (row.last_trivia_date === today) {
        return res.status(400).json({ success: false, message: "You've already submitted today's trivia." });
      }

      const pointsToAdd = answer === question.answer ? 10 : 0;

      db.run(
        `UPDATE users SET points = points + ?, last_trivia_date = ? WHERE id = ?`,
        [pointsToAdd, today, userId],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ success: false, message: 'Failed to update score' });

          // Update session user
          req.session.user.points += pointsToAdd;
          req.session.user.last_trivia_date = today;

          res.json({
            success: true,
            pointsAwarded: pointsToAdd,
            correct: pointsToAdd > 0,
            message: pointsToAdd > 0 ? "🎉 Correct! 10 points awarded." : "❌ Incorrect answer. Better luck tomorrow!"
          });
        }
      );
    }
  );
});

module.exports = router;

