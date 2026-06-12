/**
 * server.js — Roshin RG Portfolio
 * Express server serving the main portfolio and the /models section.
 */

'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ── Security headers ── */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/* ── Static assets ── */
// Main portfolio
express.static.mime.define({
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
});
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  extensions: ['html'],
}));

// 3D Models section
app.use('/models', express.static(path.join(__dirname, 'models')));

/* ── API: Contact form ── */
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Required fields missing.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Log the message (replace with email service / DB in production)
  console.log('\n[ CONTACT FORM SUBMISSION ]');
  console.log(`  Name:    ${name}`);
  console.log(`  Email:   ${email}`);
  console.log(`  Subject: ${subject || 'N/A'}`);
  console.log(`  Message: ${message}\n`);

  // Append to local log file
  const logEntry = JSON.stringify({ name, email, subject, message, ts: new Date().toISOString() }) + '\n';
  const logPath  = path.join(__dirname, 'contact-log.jsonl');
  fs.appendFile(logPath, logEntry, () => {});

  res.json({ ok: true, message: 'Message received.' });
});

/* ── SPA fallback for /models/* ── */
app.get('/models', (req, res) => {
  res.sendFile(path.join(__dirname, 'models', 'index.html'));
});

app.get('/models/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'models', 'index.html'));
});

/* ── Main portfolio fallback ── */
app.get('*', (req, res) => {
  const htmlPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.redirect('/models');
  }
});

/* ── Listen ── */
app.listen(PORT, () => {
  console.log(`\n  Roshin RG Portfolio`);
  console.log(`  ──────────────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Models:  http://localhost:${PORT}/models`);
  console.log(`  API:     http://localhost:${PORT}/api/contact\n`);
});
