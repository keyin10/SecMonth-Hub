const express = require('express');
const router = express.Router();
const db = require('../db/db');

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

const dailyWords = [
  { word: "FIREWALL", scrambled: "LAWIFERL", hint: "Network security system" },
  { word: "MALWARE", scrambled: "RWALMEA", hint: "Malicious software" },
  { word: "PHISHING", scrambled: "HSGIINHP", hint: "Fraudulent attempts to steal info" },
  { word: "ENCRYPTION", scrambled: "PONIYTNREC", hint: "Protects data" },
  { word: "RANSOMWARE", scrambled: "WORASMRNAE", hint: "Blocks access until paid" },
  { word: "BACKDOOR", scrambled: "DOBROACK", hint: "Hidden method to access a system" },
  { word: "VULNERABLE", scrambled: "LUBVERANEL", hint: "Weakness in a system" },
  { word: "PATCHES", scrambled: "STHEACP", hint: "Updates to fix security flaws" },
  { word: "HONEYPOT", scrambled: "PYONTOHE", hint: "Decoy system to catch attackers" },
  { word: "AUTHENTIC", scrambled: "NTACTIHEU", hint: "Verification of identity" },
  { word: "BOTNET", scrambled: "OENBTT", hint: "Network of compromised devices" },
  { word: "CREDENTIAL", scrambled: "CDAERINLET", hint: "Login information" },
  { word: "EXPLOIT", scrambled: "OXPITLE", hint: "Code that takes advantage of a vulnerability" },
  { word: "KEYLOGGER", scrambled: "GRELKYEOG", hint: "Records keystrokes" },
  { word: "MULTIFACTOR", scrambled: "UOMTLTARFIC", hint: "Authentication with multiple proofs" },
  { word: "ROOTKIT", scrambled: "RITOKTO", hint: "Malware that hides presence" },
  { word: "SANDBOX", scrambled: "BAOXNDS", hint: "Isolated environment to run suspicious code" },
  { word: "SPYWARE", scrambled: "YPEWSAR", hint: "Software that spies on you" },
  { word: "TOKEN", scrambled: "ENTKO", hint: "Authentication device or code" },
  { word: "TROJAN", scrambled: "OJRNTA", hint: "Malware disguised as legitimate software" },
  { word: "WORM", scrambled: "OMRW", hint: "Self-replicating malware" },
  { word: "SQLINJECTION", scrambled: "QNIESLJTIONIC", hint: "Attack injecting database commands" },
  { word: "VIRUS", scrambled: "IUSRV", hint: "Malicious program that spreads" },
  { word: "IDENTITY", scrambled: "TYIEDITN", hint: "Proof of who you are" },
  { word: "BACKUP", scrambled: "PCUAKB", hint: "Copy of data for recovery" },
  { word: "CIPHER", scrambled: "RHIEPC", hint: "Algorithm for encryption" },
  { word: "DENIAL", scrambled: "LADNIE", hint: "Type of attack that disrupts service" },
  { word: "MFA", scrambled: "AFM", hint: "Multi-factor authentication" },
  { word: "SNIFFING", scrambled: "FNSGNIFI", hint: "Intercepting network traffic" },
  { word: "SPOOFING", scrambled: "GOFISPON", hint: "Faking identity or data" },
  { word: "BREACHING", scrambled: "CINRHEGAB", hint: "Gaining unauthorized access" },
];

function getTodayWord() {
  const day = new Date().getDate() - 1;
  const index = day % dailyWords.length;
  return dailyWords[index];
}

// GET /wordunscramble
router.get('/', requireLogin, (req, res) => {
  const today = getTodayDate();

  if (req.session.user.daily_unscramble_date === today) {
    return res.render('scramble_played', {
      user: req.session.user,
      message: "You've already played today's unscramble challenge. Come back tomorrow!",
    });
  }

  const { word, scrambled, hint } = getTodayWord();

  res.render('scramble', {
    user: req.session.user,
    scrambled,
    hint,
    answer: word
  });
});

// POST /wordunscramble/submit
router.post('/submit', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const today = getTodayDate();
  const { attemptCount } = req.body;

  let pointsAwarded = 0;
  if (attemptCount <= 2) pointsAwarded = 50;
  else if (attemptCount <= 4) pointsAwarded = 25;
  else pointsAwarded = 10;

  try {
    await db.run(
      `UPDATE users SET points = points + ?, daily_unscramble_date = ? WHERE id = ?`,
      [pointsAwarded, today, userId]
    );

    req.session.user.points += pointsAwarded;
    req.session.user.daily_unscramble_date = today;

    res.json({ success: true, pointsAwarded });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ success: false, message: 'Could not update user score.' });
  }
});

module.exports = router;
