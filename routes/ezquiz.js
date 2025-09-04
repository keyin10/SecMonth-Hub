const express = require('express');
const router = express.Router();
const db = require('../db/db');
const fs = require('fs');
const path = require('path');

// Middleware: ensure user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Load quiz questions from JSON
function loadQuestions() {
  const filePath = path.join(__dirname, '../data/quizQuestions.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// GET /ezquiz - show quiz if user hasn't completed it yet
router.get('/', requireLogin, (req, res) => {
  const user = req.session.user;

  db.get(
    `SELECT date_quiz_completed FROM users WHERE id = ?`,
    [user.id],
    (err, row) => {
      if (err) return res.send("Database error");
      if (!row) return res.send("User not found");

      if (row.date_quiz_completed) {
        return res.render('quiz_played', {
          user,
          message: `You completed the World's Easiest Quiz on ${row.date_quiz_completed}.`
        });
      }

      const questions = loadQuestions();
      res.render('ezquiz', { user, questions });
    }
  );
});

// POST /ezquiz/submit - handle quiz submission
router.post('/submit', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const { answers } = req.body; // answers = { q0: 'C', q1: 'B', ... }
  const questions = loadQuestions();
  const today = new Date().toISOString().split('T')[0];

  db.get(
    `SELECT date_quiz_completed, points FROM users WHERE id = ?`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      if (!row) return res.status(404).json({ success: false, message: "User not found" });

      if (row.date_quiz_completed) {
        return res.status(400).json({ success: false, message: "You have already completed this quiz." });
      }

      // Calculate score
      let score = 0;
      questions.forEach((q, idx) => {
        if (answers[`q${idx}`] === q.answer) score++;
      });

      // Update DB
      db.run(
        `UPDATE users SET points = points + ?, date_quiz_completed = ? WHERE id = ?`,
        [score, today, userId],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ success: false, message: "Failed to update score" });

          // Update session user
          req.session.user.points += score;
          req.session.user.date_quiz_completed = today;

          res.json({
            success: true,
            score,
            total: questions.length,
            message: `You scored ${score} / ${questions.length} points!`
          });
        }
      );
    }
  );
});

module.exports = router;

