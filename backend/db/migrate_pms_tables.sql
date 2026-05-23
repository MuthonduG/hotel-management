-- PMS entities: rooms, guests, reservations, property settings (idempotent).
-- New Docker volumes: mounted as docker-entrypoint-initdb.d/03-migrate_pms_tables.sql.
-- Existing volume: npm run docker:migrate-pms (or compose exec psql < this file).

CREATE TABLE IF NOT EXISTS room (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) NOT NULL UNIQUE,
  floor SMALLINT NOT NULL DEFAULT 1,
  type VARCHAR(100) NOT NULL DEFAULT 'Standard',
  status VARCHAR(32) NOT NULL DEFAULT 'vacant',
  housekeeping_note TEXT,
  base_rate DECIMAL(10, 2) NOT NULL DEFAULT 129.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  document_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservation (
  id SERIAL PRIMARY KEY,
  guest_id INTEGER NOT NULL REFERENCES guest (id) ON DELETE RESTRICT,
  room_id INTEGER NOT NULL REFERENCES room (id) ON DELETE RESTRICT,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'upcoming',
  adults SMALLINT NOT NULL DEFAULT 2,
  total_rate DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reservation_check_dates CHECK (check_out > check_in),
  CONSTRAINT reservation_status_chk CHECK (
    status IN (
      'upcoming',
      'checked_in',
      'checked_out',
      'cancelled',
      'no_show'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_reservation_room ON reservation (room_id);

CREATE INDEX IF NOT EXISTS idx_reservation_guest ON reservation (guest_id);

CREATE INDEX IF NOT EXISTS idx_reservation_dates ON reservation (check_in, check_out);

CREATE INDEX IF NOT EXISTS idx_room_status ON room (status);

CREATE TABLE IF NOT EXISTS hotel_setting (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  property_name VARCHAR(255) NOT NULL DEFAULT 'Hotel',
  timezone VARCHAR(80) NOT NULL DEFAULT 'Africa/Addis_Ababa',
  default_check_in VARCHAR(8) NOT NULL DEFAULT '15:00',
  default_check_out VARCHAR(8) NOT NULL DEFAULT '11:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO
  hotel_setting (id)
VALUES
  (1)
ON CONFLICT (id)
DO NOTHING;

INSERT INTO room (number, floor, type, status, base_rate)
SELECT * FROM (
  VALUES
('101', 1, 'Standard', 'vacant', 129.00), ('102', 1, 'Standard', 'vacant', 129.00), ('103', 1, 'Deluxe', 'vacant', 159.00), ('104', 1, 'Deluxe', 'vacant', 159.00), ('105', 1, 'Suite', 'vacant', 229.00), ('106', 2, 'Standard', 'vacant', 129.00), ('107', 2, 'Standard', 'vacant', 129.00), ('108', 2, 'Deluxe', 'vacant', 159.00), ('109', 2, 'Deluxe', 'dirty', 159.00), ('110', 2, 'Suite', 'maintenance', 229.00), ('201', 3, 'Standard', 'vacant', 139.00), ('202', 3, 'Standard', 'vacant', 139.00), ('203', 3, 'Executive', 'vacant', 199.00)
) AS seed (number, floor, type, status, base_rate)
WHERE NOT EXISTS (SELECT 1 FROM room LIMIT 1);
