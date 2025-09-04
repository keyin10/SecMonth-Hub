const express = require("express");
const router = express.Router();
const db = require("../db/db");
const fs = require("fs");
const path = require("path");

// Middleware: require login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// Apply login requirement
router.use(requireLogin);

// Show editor page
router.get("/", (req, res) => {
  res.render("editor", { user: req.session.user });
});

// Handle save submission
/*router.post("/save", (req, res) => {
  const { code, filename } = req.body;

  if (!code || !filename) {
    return res.status(400).send("No code or filename provided");
  }

  try {
    // Ensure uploads folder exists
    const uploadPath = path.join(__dirname, "../uploads/emails");
    fs.mkdirSync(uploadPath, { recursive: true });

    // Save code to .txt file
    const filePath = path.join(uploadPath, filename);
    fs.writeFileSync(filePath, code, "utf8");

    // Insert into DB
    db.prepare(
      `INSERT INTO phishing_emails (user_id, filename, created_at, title)
       VALUES (?, ?, datetime('now'), ?)`
    ).run(req.session.user.id, filename, filename.replace(".txt", ""));

    res.redirect("/editor");
  } catch (err) {
    console.error("Error saving email:", err);
    res.status(500).send("Failed to save email");
  }
});
*/
router.post("/save", (req, res) => {
  const { code, filename } = req.body;
  const userId = req.session.user.id;

  if (!code || !filename) {
    return res.status(400).send("No code or filename provided");
  }

  try {
    // Save file
    const uploadPath = path.join(__dirname, "../uploads/emails");
    fs.mkdirSync(uploadPath, { recursive: true });
    const filePath = path.join(uploadPath, filename);
    fs.writeFileSync(filePath, code, "utf8");

    // Attempt insert; UNIQUE constraint prevents multiple submissions
    db.prepare(
      `INSERT INTO phishing_emails (user_id, filename, created_at, title)
       VALUES (?, ?, datetime('now'), ?)`
    ).run(userId, filename, filename.replace(".txt", ""));

    res.redirect("/editor");
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      return res.status(429).send("You can only submit 1 email per day.");
    }
    console.error("Error saving email:", err);
    res.status(500).send("Failed to save email");
  }
});


module.exports = router;

