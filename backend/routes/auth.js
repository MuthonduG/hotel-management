import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { getJwtSecret } from '../lib/jwt.js';

const router = Router();

/**
 * Sign in with email or username (same field as the frontend input).
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const key = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!key || !password) {
    return res.status(400).json({ error: 'Validation', message: 'Email/username and password are required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, name, role, username, email, password_hash, status
       FROM staff
       WHERE lower(username) = $1
          OR lower(coalesce(email, '')) = $1
       LIMIT 1`,
      [key],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
    }

    const row = rows[0];

    if (row.status === 'suspended') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This account is suspended. Contact your manager or system administrator.',
      });
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      {
        sub: String(row.id),
        role: row.role,
        username: row.username,
      },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
    );

    return res.json({
      token,
      user: {
        id: row.id,
        name: row.name,
        email: row.email || `${row.username}@staff.local`,
        role: row.role,
        username: row.username,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Server', message: 'Sign-in failed.' });
  }
});

export default router;
