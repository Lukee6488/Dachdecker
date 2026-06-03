-- Güldenarm GmbH & Co. KG – Dachdecker Dashboard
-- Leads-Tabelle und Auth-Setup

create extension if not exists "uuid-ossp";

-- Leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kontakt text,
  kategorie text check (kategorie in (
    'Neueindeckung',
    'Sanierung / Reparatur',
    'Flachdach / Abdichtung',
    'Dachausbau / Dachgauben',
    'Dachrinne / Entwässerung',
    'Sturmschaden / Notfall',
    'Sonstiges / Beratung'
  )),
  nachricht text,
  quelle text check (quelle in ('Voice', 'Mail')),
  datum timestamptz default now(),
  status text default 'Neu' check (status in (
    'Neu',
    'In Bearbeitung',
    'Kontaktiert',
    'Abgeschlossen'
  ))
);

-- Nutzerprofile (für Auth / Sidebar-Anzeigename)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'secretary' check (role in ('secretary')),
  created_at timestamptz default now()
);

-- Trigger: Profil automatisch anlegen wenn neuer Auth-User erstellt wird
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'secretary')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table leads enable row level security;
alter table profiles enable row level security;

-- Policies
drop policy if exists "Authenticated users can manage leads" on leads;
create policy "Authenticated users can manage leads" on leads
  for all using (auth.role() = 'authenticated');

drop policy if exists "Users can see own profile" on profiles;
create policy "Users can see own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
