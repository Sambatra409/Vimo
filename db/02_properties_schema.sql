-- ============================================================================
-- VOHITRA — Schema étape 3 : annonces, photos, favoris, tracking
-- À exécuter dans Supabase : SQL Editor > New Query > Coller > Run
-- ============================================================================

-- ENUMS ----------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_type') then
    create type public.property_type as enum (
      'appartement', 'maison', 'local_commercial', 'terrain'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_type') then
    create type public.listing_type as enum ('rent', 'sale');
  end if;

  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type public.property_status as enum (
      'draft', 'active', 'paused', 'archived'
    );
  end if;
end $$;

-- 1. TABLE properties --------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  property_type public.property_type not null,
  listing_type public.listing_type not null,
  price integer not null check (price >= 0),
  surface integer not null check (surface > 0),
  rooms integer check (rooms is null or rooms >= 0),
  address text not null,
  city text not null,
  postal_code text,
  status public.property_status not null default 'active',
  is_premium boolean not null default false,
  premium_until timestamptz,
  is_verified boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour filtres rapides
create index if not exists properties_status_idx on public.properties(status);
create index if not exists properties_city_idx on public.properties(lower(city));
create index if not exists properties_type_idx on public.properties(property_type);
create index if not exists properties_listing_idx on public.properties(listing_type);
create index if not exists properties_owner_idx on public.properties(owner_id);
create index if not exists properties_premium_idx on public.properties(is_premium, premium_until);

alter table public.properties enable row level security;

-- Trigger updated_at
drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- 2. TABLE property_photos ---------------------------------------------------
create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists property_photos_property_idx
  on public.property_photos(property_id, display_order);

alter table public.property_photos enable row level security;

-- 3. TABLE favorites ---------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index if not exists favorites_user_idx on public.favorites(user_id, created_at desc);

alter table public.favorites enable row level security;

-- 4. TABLE unlock_records (qui a débloqué quoi — pour stats proprio) --------
create table if not exists public.unlock_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  tokens_used integer not null default 0,
  unlocked_at timestamptz not null default now(),
  -- Un user ne peut débloquer la même annonce qu'une fois
  unique (user_id, property_id)
);

create index if not exists unlock_records_property_idx
  on public.unlock_records(property_id, unlocked_at desc);

alter table public.unlock_records enable row level security;

-- 5. TABLE property_views (tracking pour stats) -----------------------------
create table if not exists public.property_views (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  viewer_hash text,                   -- empreinte IP+UA pour les vues anonymes
  viewed_at timestamptz not null default now()
);

create index if not exists property_views_property_idx
  on public.property_views(property_id, viewed_at desc);

alter table public.property_views enable row level security;

-- ============================================================================
-- FIN
-- ============================================================================
-- Aucune policy RLS : tout l'accès passe par nos Server Actions
-- (qui utilisent service_role key et font les vérifs d'autorisation en TS)
-- ============================================================================
