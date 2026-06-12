-- ============================================================================
-- VOHITRA — Schema : demandes de vérification d'annonce
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type public.verification_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.verification_status not null default 'pending',
  tokens_used integer not null default 0,
  owner_note text,                                -- message optionnel du proprio
  admin_note text,                                -- note de l'admin (raison refus / confirmation)
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists verif_property_idx
  on public.verification_requests(property_id, created_at desc);
create index if not exists verif_status_idx
  on public.verification_requests(status, created_at desc);
create index if not exists verif_owner_idx
  on public.verification_requests(owner_id, created_at desc);

-- Une seule demande active (pending) par annonce
create unique index if not exists verif_one_pending_per_property
  on public.verification_requests(property_id)
  where status = 'pending';

alter table public.verification_requests enable row level security;
-- Aucune policy : l'accès passe uniquement par nos Server Actions
