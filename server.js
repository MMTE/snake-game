'use strict';

require('dotenv').config();

const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN || '';

// ==========================================
// DATABASE SETUP
// ==========================================

const db = new Database(process.env.DB_PATH || 'scores.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    user_id   TEXT PRIMARY KEY,
    username  TEXT    NOT NULL DEFAULT '',
    first_name TEXT   NOT NULL DEFAULT 'Player',
    score     INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// ==========================================
// BALE INIT DATA VALIDATION
// ==========================================

/**
 * Validate the initData string sent by the Bale mini app.
 * Uses the same HMAC-SHA256 scheme as Telegram Web Apps.
 *
 * Returns the parsed user object on success, or null on failure.
 */
function validateAndParseInitData(initData) {
  if (!initData) return null;

  // In development without a bot token, skip validation and parse unsafely.
  if (!BOT_TOKEN) {
    try {
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  try {
    const params = new URLSearchParams(initData);
    const receivedHash = params.get('hash');
    if (!receivedHash) return null;

    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (expectedHash !== receivedHash) return null;

    const userStr = params.get('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==========================================
// API ROUTES
// ==========================================

/**
 * POST /api/score
 * Body: { score: number, initData: string }
 *
 * Upserts the player's best score. Returns the player's new global rank.
 */
app.post('/api/score', (req, res) => {
  const { score, initData } = req.body || {};

  if (typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid score' });
  }

  const user = validateAndParseInitData(initData);
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Invalid or missing initData' });
  }

  const userId = String(user.id);
  const username = user.username || '';
  const firstName = user.first_name || 'Player';

  db.prepare(`
    INSERT INTO scores (user_id, username, first_name, score, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      username   = excluded.username,
      first_name = excluded.first_name,
      score      = MAX(score, excluded.score),
      updated_at = CASE
                     WHEN excluded.score > score THEN CURRENT_TIMESTAMP
                     ELSE updated_at
                   END
  `).run(userId, username, firstName, score);

  const row = db
    .prepare(`SELECT score FROM scores WHERE user_id = ?`)
    .get(userId);

  const { rank } = db
    .prepare(`SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ?`)
    .get(row.score);

  return res.json({ success: true, bestScore: row.score, rank });
});

/**
 * GET /api/leaderboard?limit=20
 *
 * Returns the top players sorted by score descending.
 */
app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const rows = db
    .prepare(`
      SELECT
        user_id,
        username,
        first_name,
        score,
        ROW_NUMBER() OVER (ORDER BY score DESC) AS rank
      FROM scores
      ORDER BY score DESC
      LIMIT ?
    `)
    .all(limit);

  return res.json(rows);
});

/**
 * GET /api/score/:userId
 *
 * Returns a single player's best score and global rank.
 */
app.get('/api/score/:userId', (req, res) => {
  const row = db
    .prepare(`
      SELECT
        user_id,
        username,
        first_name,
        score,
        (SELECT COUNT(*) + 1 FROM scores s2 WHERE s2.score > s1.score) AS rank
      FROM scores s1
      WHERE user_id = ?
    `)
    .get(req.params.userId);

  if (!row) return res.json({ score: 0, rank: null });
  return res.json(row);
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Snake Game server running on http://localhost:${PORT}`);
});
