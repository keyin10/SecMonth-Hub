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

const emojiChallenges = {
  '2025-09-01': { emojis: '📧🎣', answer: 'phishing' },
  '2025-09-02': { emojis: '👨🏻‍💻🎭', answer: 'social engineering' },
  '2025-09-03': { emojis: '🔑🔒🧍‍♂️➡️🧍‍♀️', answer: 'password sharing' },
  '2025-09-05': { emojis: '📩💲', answer: 'ransomware' },  
  '2025-09-04': { emojis: '🪲💻', answer: 'malware' },
  '2025-09-06': { emojis: '🟥🧑‍💻🔍🔓', answer: 'penetration testing' },  
  '2025-09-07': { emojis: '📡🗂️🚨', answer: 'data breach' },
  '2025-09-08': { emojis: '🕵️‍♂️💻🪲'  , answer: 'spyware' },
  '2025-09-09': { emojis: '⏳🔄💻', answer: 'update' },  
  '2025-09-10': { emojis: '🖧🚫🛜🖥️'  , answer: 'ddos' },  
  '2025-09-11': { emojis: '🔥🧱', answer: 'firewall' },
  '2025-09-12': { emojis: '🤖🌐🖧', answer: 'botnet' },  
  '2025-09-13': { emojis: '🔒🔑🔓'  , answer: 'decryption' },
  '2025-09-14': { emojis: '𝟎📅🪲', answer: 'zero day' },
  '2025-09-15': { emojis: '📱🔢✅', answer: 'mfa' },
  '2025-09-16': { emojis: '🐞💲', answer: 'bug bounty' },
  '2025-09-17': { emojis: '🔑🧾', answer: 'password list' },
  '2025-09-18': { emojis: '⚫🌐'  , answer: 'dark web' },
  '2025-09-19': { emojis: '🔓🔑🔒', answer: 'encryption' },
  '2025-09-20': { emojis: '🔐🧾', answer: 'privacy policy' },
  '2025-09-21': { emojis: '⚠️📊'  , answer: 'risk assessment' },
  '2025-09-22': { emojis: '🛑🧑‍💻🛠️'  , answer: 'access control' },
  '2025-09-23': { emojis: '🟥👥🕶️'  , answer: 'red team' },   
  '2025-09-24': { emojis: '🔐📝✅'  , answer: 'audit' },
  '2025-09-25': { emojis: '🛡️💡🧠', answer: 'security awareness' },
  '2025-09-26': { emojis: '🧾🗂️🗑️'  , answer: 'data disposal' },
  '2025-09-27': { emojis: '🟦🕵️‍♀️💾🔍'  , answer: 'digital forensics' },
  '2025-09-28': { emojis: '🧪🐞📡🔎', answer: 'vulnerability scanning' },
  '2025-09-29': { emojis: '📧🧑‍💻🔗📥🪲', answer: 'drive by download' },
  '2025-09-30': { emojis: '💻🧠🦾', answer: 'ai' }, 
  '2025-09-31': { emojis: '📞👵💳❗', answer: 'scam' },  
};

router.get('/', requireLogin, async (req, res, next) => {
  try {
    const today = getTodayDate();
    const user = req.session.user; // Use session user directly
    const challenge = emojiChallenges[today];

    if (!challenge) {
      return res.render('emoji_play', {
        user,
        alreadyPlayed: true,
        emojis: null,
        message: 'No challenge found for today.',
      });
    }

    if (user.last_emoji_date === today) {
      return res.render('emoji_played', { user });
    }

    res.render('emoji_play', {
      user,
      alreadyPlayed: false,
      emojis: challenge.emojis,
      message: null,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireLogin, async (req, res, next) => {
  try {
    const today = getTodayDate();
    const guess = req.body.guess?.trim().toLowerCase();
    const user = req.session.user;
    const challenge = emojiChallenges[today];

    if (!challenge) {
      return res.render('emoji_play', {
        user,
        alreadyPlayed: true,
        emojis: null,
        message: 'No challenge available today.',
      });
    }

//    if (user.last_emoji_date === today) {
  //    return res.render('emoji_play', {
    //    user,
      //  alreadyPlayed: true,
        //emojis: null,
        //message: "You already solved today's challenge. Come back tomorrow!",
      //});
    //}

    if (user.last_emoji_date === today) {
      return res.render('emoji_played', { user });
    }


    if (guess === challenge.answer) {
      // Update DB with new points and date
      await db.run(
        'UPDATE users SET points = points + 75, last_emoji_date = ? WHERE id = ?',
        [today, user.id]
      );

      // Update session user manually (add 75 points and update date)
      user.points = (user.points || 0) + 75;
      user.last_emoji_date = today;
      req.session.user = user;

      return res.render('emoji_played', {
        user,
        message: '🎉 Correct! You earned 75 points. Come back tomorrow!',
      });
    } else {
      return res.render('emoji_play', {
        user,
        alreadyPlayed: false,
        emojis: challenge.emojis,
        message: '❌ Incorrect. Try again!',
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

