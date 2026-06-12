-- ============================================================================
-- VOHITRA — Schema vérification d'annonces
-- ============================================================================

-- ENUM des statuts de demande
do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type public.verification_status as enum (
      'pending', 'approved', 'rejected', 'cancelled'
    );
  end if;
end $$;

-- TABLE verification_requests ------------------------------------------------
create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status public.verification_status not null default 'pending',
  tokens_paid integer not null default 0,
  user_message text,                              -- message optionnel du proprio
  admin_note text,                                -- note de l'admin lors de la décision
  contact_attempts integer not null default 0,    -- combien de fois l'admin a tenté de contacter
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Une seule demande "pending" par annonce
create unique index if not exists verification_one_pending_per_property
  on public.verification_requests(property_id)
  where status = 'pending';

create index if not exists verification_status_idx
  on public.verification_requests(status, created_at desc);

create index if not exists verification_property_idx
  on public.verification_requests(property_id, created_at desc);

alter table public.verification_requests enable row level security;

-- Trigger updated_at
drop trigger if exists verification_set_updated_at on public.verification_requests;
create trigger verification_set_updated_at
  before update on public.verification_requests
  for each row execute function public.set_updated_at();

-- ============================================================================
-- FIN
-- ============================================================================
