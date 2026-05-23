-- Run once against your database: psql $DATABASE_URL -f db/schema.sql
-- Or: npm run init-db (from server/)

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  manager_staff_id INTEGER REFERENCES staff (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_status_chk CHECK (
    status IN ('active', 'suspended')
  )
);

CREATE INDEX IF NOT EXISTS idx_staff_role ON staff (role);

CREATE INDEX IF NOT EXISTS idx_staff_manager ON staff (manager_staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_status ON staff (status);
