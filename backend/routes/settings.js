import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireStaffJwt } from '../middleware/requireStaffJwt.js';

const router = Router();
router.use(requireStaffJwt);

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, property_name, timezone, default_check_in, default_check_out, updated_at FROM hotel_setting WHERE id = 1`,
    );
    if (!rows.length) {
      return res.json({
        settings: {
          property_name: 'Hotel',
          timezone: 'Africa/Addis_Ababa',
          default_check_in: '15:00',
          default_check_out: '11:00',
        },
      });
    }
    return res.json({ settings: rows[0] });
  } catch (err) {
    console.error('[settings GET]', err);
    return res.status(500).json({ error: 'Server', message: 'Could not load settings.' });
  }
});

router.put('/', async (req, res) => {
  const { property_name, timezone, default_check_in, default_check_out } = req.body ?? {};
  try {
    const { rows } = await pool.query(
      `UPDATE hotel_setting SET
         property_name = COALESCE(NULLIF(trim($1::text), ''), property_name),
         timezone = COALESCE(NULLIF(trim($2::text), ''), timezone),
         default_check_in = COALESCE(NULLIF(trim($3::text), ''), default_check_in),
         default_check_out = COALESCE(NULLIF(trim($4::text), ''), default_check_out),
         updated_at = NOW()
       WHERE id = 1
       RETURNING id, property_name, timezone, default_check_in, default_check_out, updated_at`,
      [
        property_name != null ? String(property_name) : null,
        timezone != null ? String(timezone) : null,
        default_check_in != null ? String(default_check_in) : null,
        default_check_out != null ? String(default_check_out) : null,
      ],
    );
    return res.json({ settings: rows[0] });
  } catch (err) {
    console.error('[settings PUT]', err);
    return res.status(500).json({ error: 'Server', message: 'Could not save settings.' });
  }
});

export default router;
