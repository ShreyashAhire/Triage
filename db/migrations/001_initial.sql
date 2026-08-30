CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor','nurse','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0),
  sex TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  complaint TEXT NOT NULL,
  symptoms TEXT NOT NULL DEFAULT '',
  history TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  medications TEXT NOT NULL DEFAULT '',
  heart_rate INTEGER NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  spo2 INTEGER NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  pain INTEGER NOT NULL CHECK (pain BETWEEN 0 AND 10),
  esi INTEGER NOT NULL CHECK (esi BETWEEN 1 AND 5),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  event TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS patients_queue_idx ON patients (esi, created_at);
CREATE INDEX IF NOT EXISTS audit_patient_idx ON audit_logs (patient_id, created_at DESC);
