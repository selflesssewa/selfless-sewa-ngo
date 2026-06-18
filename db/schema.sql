-- Selfless Sewa — Autopay (recurring donations) schema
-- Run this once against your Postgres database (Vercel Postgres / Supabase).
--   psql "$DATABASE_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- One row per recurring-donation mandate.
CREATE TABLE IF NOT EXISTS subscriptions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_subscription_id  text UNIQUE NOT NULL,        -- our id, sent to PhonePe
  phonepe_subscription_id   text,                        -- returned by PhonePe once active
  setup_order_id            text UNIQUE NOT NULL,         -- merchantOrderId of the setup transaction
  donor_name                text,
  donor_contact             text,
  donor_email               text,
  donor_pan                 text,
  donor_address             text,
  amount                    integer NOT NULL,            -- rupees, fixed per cycle
  frequency                 text NOT NULL,               -- MONTHLY | QUARTERLY | HALFYEARLY | YEARLY
  status                    text NOT NULL DEFAULT 'PENDING', -- PENDING|ACTIVE|PAUSED|CANCELLED|FAILED
  next_charge_at            timestamptz,                 -- when the next notify/redeem runs
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_due
  ON subscriptions (next_charge_at)
  WHERE status = 'ACTIVE';

-- One row per attempted recurring charge.
CREATE TABLE IF NOT EXISTS redemptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  merchant_order_id text UNIQUE NOT NULL,                -- our id for this charge
  notification_id   text,                                -- from the notify call
  amount            integer NOT NULL,
  state             text NOT NULL DEFAULT 'CREATED',     -- CREATED|NOTIFIED|SUCCESS|FAILED
  -- receipt / archival tracking
  receipt_issued    boolean NOT NULL DEFAULT false,
  drive_file_id     text,
  drive_file_link   text,
  ledger_appended   boolean NOT NULL DEFAULT false,
  archive_error     text,
  attempted_at      timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_redemptions_subscription
  ON redemptions (subscription_id);
