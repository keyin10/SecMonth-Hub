const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/db');
const app = express();
const SQLiteStore = require('connect-sqlite3')(session); //new
const helmet = require('helmet'); //new

// Middleware
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      scriptSrcAttr: ["'unsafe-inline'"]
      //Possibly add more directives
    },
  })
);

// Simple session setup
//app.use(session({
//  secret: process.env.SESSION_SECRET || 'your-secret-key',
//  resave: false,
// saveUninitialized: true
//}));

//New
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './db' }),
  secret: process.env.SESSION_SECRET || 'change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    sameSite: 'lax'
  }
}));

//Image Display
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const wordleRoutes = require('./routes/wordle');
const challengesRoutes = require('./routes/challenges');
const wordUnscrambleRoutes = require('./routes/wordunscramble');
const emojiGameRouter = require('./routes/emoji_game');
const imageUploadRoutes = require('./routes/imageupload');
const editorRouter = require("./routes/editor");
const ezquizRoute = require('./routes/ezquiz');
const triviaRouter = require('./routes/trivia');
const aisongsRouter = require('./routes/aisongs');
app.use('/', aisongsRouter); 
app.use('/trivia', triviaRouter);
app.use('/imageupload', imageUploadRoutes);
app.use('/ezquiz', ezquizRoute);
app.use("/editor", editorRouter);
//app.use('/', imageUploadRoutes);
app.use('/emoji', emojiGameRouter);
app.use('/wordunscramble', wordUnscrambleRoutes);
app.use('/challenges', challengesRoutes);
app.use('/wordle', wordleRoutes);
app.use('/register', registerRoute);
app.use('/login', loginRoute);

//Home /dashboard
app.get('/', (req, res) => {
  const user = req.session.user;

  const leaderboardSql = `SELECT email, points FROM users ORDER BY points DESC LIMIT 5`;
  const imagesSql = `SELECT path, title, submitted_by FROM images ORDER BY uploaded_at DESC LIMIT 8`;
  const songsSql = `SELECT path, title, submitted_by FROM aisongs ORDER BY uploaded_at DESC LIMIT 3`;

  db.all(leaderboardSql, [], (err, leaderboardRows) => {
    if (err) {
      console.error('Failed to fetch leaderboard:', err);
      return res.render('dashboard', { user, leaderboard: [], images: [], songs: [] });
    }

    db.all(imagesSql, [], (imgErr, imageRows) => {
      if (imgErr) {
        console.error('Failed to fetch images:', imgErr);
        return res.render('dashboard', { user, leaderboard: leaderboardRows, images: [], songs: [] });
      }

      db.all(songsSql, [], (songErr, songRows) => {
        if (songErr) {
          console.error('Failed to fetch songs:', songErr);
          return res.render('dashboard', { user, leaderboard: leaderboardRows, images: imageRows, songs: [] });
        }

        res.render('dashboard', {
          user,
          leaderboard: leaderboardRows,
          images: imageRows,
          songs: songRows
        });
      });
    });
  });
});

//Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/'); // Fallback if logout fails
    }

    res.clearCookie('connect.sid'); // Clear session cookie (optional but cleaner)
    res.redirect('/login');
  });
});

//Leaderboard
app.get('/leaderboard', (req, res) => {
  const user = req.session.user;

  const sql = `SELECT email, points FROM users ORDER BY points DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Failed to fetch full leaderboard:', err);
      return res.render('leaderboard', { user, leaderboard: [] });
    }

    res.render('leaderboard', { user, leaderboard: rows });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

