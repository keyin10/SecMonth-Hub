-- schema.sql

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- bcrypt hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_name TEXT,
    score INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    file_type TEXT, -- 'image' or 'song'
    file_path TEXT, -- or blob if you want inline storage
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

