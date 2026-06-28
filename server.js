/**
 * server.js — RGR Portfolio Express Backend
 *
 * Provides a /api/contact endpoint as an alternative to Formspree.
 * By default the portfolio uses Formspree (no backend required).
 *
 * TO USE THIS SERVER:
 *   1. Run: npm install
 *   2. Create a .env file (see below)
 *   3. Run: npm start  (or npm run dev for hot-reload)
 *   4. Update index.html form action to: /api/contact
 *
 * .env file contents:
 *   PORT=3000
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *   SMTP_USER=your-email@gmail.com
 *   SMTP_PASS=your-app-password
 *   MAIL_TO=roshin.rg.2024.aids@rajalakshmi.edu.in
 *   MAIL_FROM="RGR Portfolio <no-reply@roshinrg.dev>"
 *   ALLOWED_ORIGIN=https://roshinrg.github.io
 */

"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ─── Middleware ────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS — allow same origin + configured origin
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3131",
      process.env.ALLOWED_ORIGIN || "https://roshinrg.github.io",
    ],
    methods: ["GET", "POST"],
  }),
);

// Rate limit contact endpoint — max 5 requests per 15 min per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ─── Static files (serve the SPA) ─────────────────────── */
app.use(
  express.static(path.join(__dirname), {
    index: "index.html",
    extensions: ["html"],
  }),
);

/* ─── Nodemailer transporter ────────────────────────────── */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/* ─── POST /api/contact ─────────────────────────────────── */
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  /* Basic validation */
  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email, and message are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }
  if (message.length < 10) {
    return res
      .status(400)
      .json({ error: "Message too short (min 10 characters)." });
  }

  /* Send email */
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from:
        process.env.MAIL_FROM || `"RGR Portfolio" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || "roshin.rg.2024.aids@rajalakshmi.edu.in",
      replyTo: email,
      subject: `[Portfolio Contact] ${subject || "New message from " + name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#d4af37">New Portfolio Message</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;color:#888;width:80px">Name</td><td style="padding:8px">${name}</td></tr>
            <tr><td style="padding:8px;color:#888">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            ${subject ? `<tr><td style="padding:8px;color:#888">Subject</td><td style="padding:8px">${subject}</td></tr>` : ""}
          </table>
          <hr style="border:1px solid #222;margin:16px 0" />
          <p style="white-space:pre-wrap;line-height:1.6">${message}</p>
        </div>
      `,
    });

    return res
      .status(200)
      .json({ ok: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("[/api/contact] SMTP error:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to send message. Please try again." });
  }
});

/* ─── SPA fallback — all other routes serve index.html ─── */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ─── Start ─────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n  ⚡ RGR Portfolio server running`);
  console.log(`  → Local:  http://localhost:${PORT}`);
  console.log(`  → Env:    ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;
