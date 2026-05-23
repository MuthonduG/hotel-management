import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { requireStaffJwt } from '../middleware/requireStaffJwt.js';
import { ROLES, ASSIGNABLE_STAFF_ROLES } from '../lib/roles.js';

const router = Router();
const SALT_ROUNDS = 12;

router.use(requireStaffJwt);

const SORTED_ASSIGNABLE = [...ASSIGNABLE_STAFF_ROLES].sort((a, b) => a.localeCompare(b));

router.get('/creatable-roles', async (_req, res) => {
  return res.json({ roles: SORTED_ASSIGNABLE });
});

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, role, username, email, status, manager_staff_id, created_at
       FROM staff
       ORDER BY id ASC`,
    );
    return res.json({ staff: rows });
  } catch (err) {
    console.error('[admin/staff GET]', err);
    return res.status(500).json({ error: 'Server', message: 'Could not list staff.' });
  }
});

router.post('/', async (req, res) => {
  const { name, role, username, password } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Validation', message: 'Name is required.' });
  }
  if (!role || typeof role !== 'string' || !ASSIGNABLE_STAFF_ROLES.includes(role)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Invalid role. Choose one of: ${SORTED_ASSIGNABLE.join(', ')}.`,
    });
  }
  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'Validation', message: 'Username is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      error: 'Validation',
      message: 'Password must be at least 8 characters.',
    });
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanName = name.trim();
  const mgrId = Number(req.auth.staffId);

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO staff (name, role, username, password_hash, status, manager_staff_id)
       VALUES ($1, $2, $3, $4, 'active', $5)
       RETURNING id, name, role, username, email, status, manager_staff_id, created_at`,
      [cleanName, role, cleanUser, password_hash, mgrId],
    );

    const row = result.rows[0];
    return res.status(201).json({
      staff: {
        id: row.id,
        name: row.name,
        role: row.role,
        username: row.username,
        email: row.email,
        status: row.status,
        manager_staff_id: row.manager_staff_id,
        created_at: row.created_at,
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'That username is already taken.',
      });
    }
    console.error('[admin/staff POST]', err);
    return res.status(500).json({ error: 'Server', message: 'Could not create staff member.' });
  }
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Validation', message: 'Invalid staff id.' });
  }

  const { status } = req.body ?? {};
  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Validation', message: 'status must be active or suspended.' });
  }

  try {
    const { rows: targetRows } = await pool.query(
      `SELECT id, role, username, manager_staff_id, status FROM staff WHERE id = $1`,
      [id],
    );
    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'Not found', message: 'No such staff member.' });
    }
    const target = targetRows[0];

    if (target.role === ROLES.SYSTEM_ADMIN && status === 'suspended') {
      const { rows: cnt } = await pool.query(
        `SELECT COUNT(*)::int AS c FROM staff WHERE role IN ('SystemAdmin', 'Admin') AND status = 'active'`,
      );
      if (cnt[0].c <= 1) {
        return res.status(400).json({
          error: 'Validation',
          message: 'Cannot suspend the only active system administrator.',
        });
      }
    }

    await pool.query(`UPDATE staff SET status = $1 WHERE id = $2`, [status, id]);
    return res.json({ ok: true, id, status });
  } catch (err) {
    console.error('[admin/staff PATCH]', err);
    return res.status(500).json({ error: 'Server', message: 'Could not update staff status.' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Validation', message: 'Invalid staff id.' });
  }

  if (id === req.auth.staffId) {
    return res.status(400).json({ error: 'Validation', message: 'You cannot remove your own account while signed in.' });
  }

  try {
    const { rows: targetRows } = await pool.query(
      `SELECT id, role, manager_staff_id FROM staff WHERE id = $1`,
      [id],
    );
    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'Not found', message: 'No such staff member.' });
    }

    const target = targetRows[0];

    if (target.role === ROLES.SYSTEM_ADMIN || target.role === 'Admin') {
      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS c FROM staff WHERE role IN ('SystemAdmin', 'Admin')`,
      );
      if (countRows[0].c <= 1) {
        return res.status(400).json({
          error: 'Validation',
          message: 'Cannot delete the only system administrator.',
        });
      }
    }

    await pool.query(`DELETE FROM staff WHERE id = $1`, [id]);
    return res.status(204).send();
  } catch (err) {
    console.error('[admin/staff DELETE]', err);
    return res.status(500).json({ error: 'Server', message: 'Could not remove staff member.' });
  }
});

export default router;
