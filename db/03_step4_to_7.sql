-- ============================================================================
-- VOHITRA — Schema étape 4/5/6/7
-- Tokens, messages, alertes, storage bucket
-- ============================================================================

-- 1. STORAGE BUCKET pour les photos d'annonces -------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'properties',
  'properties',
  true,                -- URLs publiques (les annonces sont publiques de toute façon)
  2097152,             -- 2 MB max par photo (déjà compressé en amont)
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies de lecture publique sur le bucket
drop policy if exists "Public read access" on storage.objects;
create policy "Public read access" on storage.objects
  for select using (bucket_id = 'properties');

-- L'upload/delete passe par service_role uniquement via Server Actions
-- => pas de policy insert/delete/update (RLS bloque par défaut)

-- 2. TABLE token_purchases ---------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'purchase_status') then
    create type public.purchase_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.token_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_size integer not null check (pack_size > 0),
  amount_ar integer not null check (amount_ar > 0),
  payment_reference text not null,
  payment_method text not null default 'mvola',
  status public.purchase_status not null default 'pending',
  admin_note text,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists token_purchases_user_idx
  on public.token_purchases(user_id, created_at desc);
create index if not exists token_purchases_status_idx
  on public.token_purchases(status, created_at desc);

alter table public.token_purchases enable row level security;

-- 3. TABLE messages ----------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) > 0 and length(content) <= 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index pour récupérer rapidement les conversations
create index if not exists messages_thread_idx
  on public.messages(property_id, sender_id, recipient_id, created_at desc);
create index if not exists messages_recipient_unread_idx
  on public.messages(recipient_id, read_at) where read_at is null;

alter table public.messages enable row level security;

-- 4. TABLE alerts ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'alert_frequency') then
    create type public.alert_frequency as enum ('instant', 'daily', 'weekly');
  end if;
end $$;

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  frequency public.alert_frequency not null default 'daily',
  is_active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists alerts_user_idx on public.alerts(user_id, created_at desc);

alter table public.alerts enable row level security;

-- 5. RPC : incrément atomique des vues sur une annonce ----------------------
create or replace function public.increment_property_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.properties set view_count = view_count + 1 where id = p_id;
$$;

-- ============================================================================
-- FIN — Total après les 3 schemas : 11 tables + 1 bucket
-- ============================================================================
