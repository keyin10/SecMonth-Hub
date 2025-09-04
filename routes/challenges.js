const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const user = req.session.user || null;

  // List of challenges - you can add metadata like url, name, description, icon etc.
  const challenges = [
    { id: 1, name: 'Daily Security Wordle', url: '/wordle', description: 'Guess the cybersecurity term and earn points on the leaderboard!' },
    { id: 2, name: 'Daily EmojiSec', url: '/emoji', description: 'Complete emoji analysis to guess security concepts and earn points!' },
    { id: 3, name: 'Daily Word Decryption', url: '/wordunscramble', description: 'Unscramble these cyber security terms and earn points!' },
    { id: 4, name: "Make your own phishing email", url: '/editor', description: 'Create a phishing email using HTML and CSS for a chance to have it used against the company.' },
    { id: 5, name: 'AI Image Upload', url: '/imageupload', description: 'Use AI to create some cyber security memes and images to earn points and get showcased on the homepage!' },
    { id: 6, name: "AI Song Upload", url: '/aisongs', description: "Test your music skills by creating and uploading an AI generated song." }, // Add more challenges as you build them
    { id: 7, name: "Daily Policy Trivia", url: '/trivia', description: "Test your SOTI policy knowledge with the daily policy trivia challenge!" },
    { id: 8, name: "World's Easiest Quiz", url: '/ezquiz', description: "It's so easy it's basically free points." },
    { id: 9, name: "Capture the Flag (CTF)", url: '#', description: "Compete and complete challenges ranging from a variety of technical difficulty. At the end of October your CTF points will be combined into your total score." }, 
 ];

  res.render('challenges', { user, challenges });
});

module.exports = router;

