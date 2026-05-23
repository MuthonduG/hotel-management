-- Run once when upgrading from pre-hierarchy installs (Postgres already has `staff`).
-- psql "$DATABASE_URL" -f backend/db/migrate_legacy_roles.sql

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS manager_staff_id INTEGER REFERENCES staff (id) ON DELETE SET NULL;

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_status_chk;

ALTER TABLE staff
ADD CONSTRAINT staff_status_chk CHECK (status IN ('active', 'suspended'));

UPDATE staff
SET
  role = 'SystemAdmin'
WHERE
  role = 'Admin';

CREATE INDEX IF NOT EXISTS idx_staff_manager ON staff (manager_staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_status ON staff (status);
