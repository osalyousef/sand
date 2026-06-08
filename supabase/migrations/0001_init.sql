-- سند: initial schema for pilgrim health management

create extension if not exists pgcrypto;

create table pilgrims (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age int not null,
  nationality text,
  passport_number text unique,
  has_diabetes boolean default false,
  has_heart_condition boolean default false,
  has_hypertension boolean default false,
  medications text[],
  created_at timestamptz default now()
);

create table vitals (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid references pilgrims(id) not null,
  heart_rate int,
  temperature float,
  oxygen_level float,
  recorded_at timestamptz default now()
);

create table risk_assessments (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid references pilgrims(id) not null,
  risk_level text check (risk_level in ('green', 'yellow', 'red')),
  score float,
  assessed_at timestamptz default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  pilgrim_id uuid references pilgrims(id) not null,
  latitude float,
  longitude float,
  recorded_at timestamptz default now()
);

create index idx_vitals_pilgrim on vitals(pilgrim_id, recorded_at desc);
create index idx_risk_pilgrim on risk_assessments(pilgrim_id, assessed_at desc);
create index idx_locations_pilgrim on locations(pilgrim_id, recorded_at desc);

-- Realtime: dashboard subscribes to risk_assessments and locations for live updates
alter publication supabase_realtime add table risk_assessments;
alter publication supabase_realtime add table locations;
alter publication supabase_realtime add table vitals;

-- Hackathon mode: open RLS so demo works without auth wiring on every table.
-- Tighten before any real deployment.
alter table pilgrims enable row level security;
alter table vitals enable row level security;
alter table risk_assessments enable row level security;
alter table locations enable row level security;

create policy "allow all - pilgrims" on pilgrims for all using (true) with check (true);
create policy "allow all - vitals" on vitals for all using (true) with check (true);
create policy "allow all - risk_assessments" on risk_assessments for all using (true) with check (true);
create policy "allow all - locations" on locations for all using (true) with check (true);
