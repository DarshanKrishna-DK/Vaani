-- ============================================================
-- Vaani - Supabase / Postgres schema
-- ============================================================
-- This mirrors the shape of the in-memory seed (backend/src/data/seed.js).
-- To use a real database instead of the in-memory store:
--   1. Create a free project at https://supabase.com
--   2. Run this file in the Supabase SQL editor
--   3. Set SUPABASE_URL and SUPABASE_KEY in backend/.env
--   4. Re-point backend/src/services/store.js at the Supabase client
--      (a commented drop-in block is provided at the bottom of that file)
--
-- Nothing else in the product needs to change - the repository interface
-- (getUser, getAccounts, addTransaction, ...) stays identical.
-- ============================================================

create table if not exists users (
  id                 text primary key,
  name               text not null,
  preferred_language text not null default 'hinglish',
  phone              text,
  occupation         text,
  city               text,
  voice_enrolled     boolean default false,
  created_at         timestamptz default now()
);

create table if not exists accounts (
  id            text primary key,
  user_id       text references users(id) on delete cascade,
  type          text not null,                 -- savings | recurring_deposit | kcc | current
  number        text not null,
  balance       numeric(14,2) not null default 0,
  currency      text not null default 'INR',
  credit_limit  numeric(14,2),
  maturity_date timestamptz,
  monthly_installment numeric(14,2)
);

create table if not exists transactions (
  id         text primary key,
  user_id    text references users(id) on delete cascade,
  account_id text references accounts(id) on delete cascade,
  date       timestamptz not null default now(),
  descr      text not null,
  category   text not null,                     -- fuel | food | income | bills | emi | ...
  amount     numeric(14,2) not null,            -- negative = debit, positive = credit
  type       text not null                      -- debit | credit
);

create table if not exists payees (
  id      text primary key,
  user_id text references users(id) on delete cascade,
  name    text not null,
  upi_id  text,
  last4   text
);

create table if not exists mandates (
  id          text primary key,
  user_id     text references users(id) on delete cascade,
  account_id  text references accounts(id) on delete cascade,
  payee       text not null,
  amount      numeric(14,2) not null,
  next_debit  timestamptz not null,
  type        text not null                     -- autopay | emi | sip
);

create table if not exists life_context (
  key       text primary key,
  user_id   text references users(id) on delete cascade,
  label     text not null,
  note      text,
  next_date timestamptz
);

create table if not exists disputes (
  id                  text primary key,
  user_id             text references users(id) on delete cascade,
  transaction_id      text,
  txn_desc            text,
  amount              numeric(14,2),
  reason              text,
  status              text not null default 'filed',
  created_at          timestamptz default now(),
  expected_resolution timestamptz
);

create table if not exists audit_log (
  id       text primary key,
  user_id  text references users(id) on delete cascade,
  at       timestamptz default now(),
  kind     text,                                -- read | action | utterance
  action   text,
  detail   jsonb
);

-- Helpful indexes
create index if not exists idx_txn_user_date on transactions(user_id, date desc);
create index if not exists idx_mandate_user  on mandates(user_id, next_debit);
create index if not exists idx_audit_user    on audit_log(user_id, at desc);

-- Row Level Security (recommended for production; enable and add policies
-- so each authenticated customer can only read their own rows).
-- alter table accounts enable row level security;
-- create policy "own rows" on accounts for select using (auth.uid()::text = user_id);
