const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/'); // fallback to dashboard
    }
    res.clearCookie('connect.sid'); // optional: clear cookie if you want
    res.redirect('/login');
  });
});

module.exports = router;

