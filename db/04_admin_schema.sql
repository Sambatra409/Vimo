-- ============================================================================
-- VOHITRA — Schema étape 8/9 : ADMIN
-- Packs dynamiques, ban users, quota quotidien gratuit, audit jetons
-- ============================================================================

-- 1. EXTENSIONS DE profiles --------------------------------------------------
alter table public.profiles
  add column if not exists is_banned boolean not null default false,
  add column if not exists ban_reason text;

create index if not exists profiles_banned_idx on public.profiles(is_banned);

-- 2. EXTENSION de site_settings ---------------------------------------------
alter table public.site_settings
  add column if not exists free_unlocks_per_day integer not null default 0 check (free_unlocks_per_day >= 0),
  add column if not exists site_name text not null default 'Vohitra',
  add column if not exists support_email text not null default 'contact@vohitra.mg',
  add column if not exists support_phone text not null default '034 00 000 00';

-- 3. TABLE token_packs (packs dynamiques modifiables par admin) -------------
create table if not exists public.token_packs (
  id uuid primary key default gen_random_uuid(),
  size integer not null unique check (size > 0),
  price_ar integer not null check (price_ar > 0),
  label text,
  badge text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.token_packs enable row level security;

-- Lecture publique (pour la page /tokens)
drop policy if exists "token_packs_select_anyone" on public.token_packs;
create policy "token_packs_select_anyone" on public.token_packs
  for select using (is_active = true);

-- Seed des packs par défaut
insert into public.token_packs (size, price_ar, label, badge, display_order) values
  (1,  5000,   null,         null,    0),
  (5,  22500,  'Économique', null,    1),
  (10, 40000,  'Populaire',  '-20%',  2),
  (25, 87500,  'Pro',        '-30%',  3),
  (50, 150000, 'Pro+',       '-40%',  4)
on conflict (size) do nothing;

drop trigger if exists token_packs_set_updated_at on public.token_packs;
create trigger token_packs_set_updated_at
  before update on public.token_packs
  for each row execute function public.set_updated_at();

-- 4. TABLE token_adjustments (audit log : qui a modifié les jetons de qui) --
do $$
begin
  if not exists (select 1 from pg_type where typname = 'adjustment_reason') then
    create type public.adjustment_reason as enum (
      'purchase_approved', 'admin_grant', 'admin_revoke',
      'unlock_spent', 'refund', 'other'
    );
  end if;
end $$;

create table if not exists public.token_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,                  -- positif = crédit, négatif = débit
  reason public.adjustment_reason not null,
  note text,
  performed_by uuid references auth.users(id) on delete set null,
  related_purchase_id uuid references public.token_purchases(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists token_adjustments_user_idx
  on public.token_adjustments(user_id, created_at desc);

alter table public.token_adjustments enable row level security;

-- 5. RPC : promote/demote user role ------------------------------------------
-- Utilitaire pour donner le rôle admin à un user par email (à appeler manuellement)
create or replace function public.promote_user_to_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from public.profiles where email = p_email;
  if v_user_id is null then
    raise exception 'Aucun utilisateur avec l''email %', p_email;
  end if;

  insert into public.user_roles (user_id, role)
  values (v_user_id, 'admin')
  on conflict (user_id, role) do nothing;
end;
$$;

-- ============================================================================
-- FIN
-- ============================================================================
-- Pour donner le rôle admin à un user existant, exécute :
--   select public.promote_user_to_admin('ton.email@gmail.com');
-- ============================================================================
