-- db/schema.sql
CREATE TABLE IF NOT EXISTS stations (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  brand        TEXT NOT NULL DEFAULT '',
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  address      TEXT NOT NULL DEFAULT '',
  province     TEXT NOT NULL DEFAULT '',
  municipality TEXT NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  station_id  TEXT NOT NULL REFERENCES stations(id),
  fuel_type   TEXT NOT NULL CHECK (fuel_type IN ('g95', 'diesel', 'g98', 'glp', 'gnc')),
  price       NUMERIC(5,3) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_station_fuel_time
  ON price_snapshots (station_id, fuel_type, captured_at DESC);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    TEXT NOT NULL,
  station_id TEXT NOT NULL REFERENCES stations(id),
  label      TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (user_id, station_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
