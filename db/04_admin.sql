-- ============================================================================
-- VOHITRA — Schema étape 8-9 : Admin, audit, déblocages gratuits journaliers
-- ============================================================================

-- 1. AJOUTER LES COLONNES MANQUANTES ----------------------------------------

-- Paramètres globaux : N déblocages gratuits par jour (non cumulables)
alter table public.site_settings
  add column if not exists free_unlocks_per_day integer not null default 0
    check (free_unlocks_per_day >= 0);

-- Profils : possibilité de bannir un utilisateur
alter table public.profiles
  add column if not exists is_banned boolean not null default false;
alter table public.profiles
  add column if not exists banned_reason text;
alter table public.profiles
  add column if not exists banned_at timestamptz;

-- 2. TABLE audit_log : trace de toutes les actions admin --------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,              -- ex: 'adjust_tokens', 'ban_user', 'approve_purchase'
  target_type text,                  -- 'user', 'property', 'purchase', 'settings'
  target_id uuid,
  details jsonb,                     -- contexte libre (ancien/nouveau, raison, etc.)
  created_at timestamptz not null default now()
);

create index if not exists audit_log_recent_idx
  on public.audit_log(created_at desc);
create index if not exists audit_log_admin_idx
  on public.audit_log(admin_id, created_at desc);

alter table public.audit_log enable row level security;

-- ============================================================================
-- 3. ⚠️ PROMOTION D'UN UTILISATEUR EN ADMIN
-- ============================================================================
-- Décommente et remplace 'ton-email@example.com' par TON email d'admin,
-- puis exécute ce bloc séparément.
--
-- IMPORTANT : ce script donne aussi les rôles proprietaire et locataire
-- pour que l'admin puisse tester toutes les vues.
--
-- ============================================================================

-- do $$
-- declare
--   v_user_id uuid;
-- begin
--   select id into v_user_id from public.profiles
--     where email = lower('TON-EMAIL@example.com');
--
--   if v_user_id is null then
--     raise exception 'Utilisateur non trouvé. Crée d''abord un compte avec cet email.';
--   end if;
--
--   -- Promouvoir admin + ajouter les autres rôles
--   insert into public.user_roles (user_id, role) values
--     (v_user_id, 'admin'),
--     (v_user_id, 'proprietaire'),
--     (v_user_id, 'locataire')
--   on conflict do nothing;
--
--   -- Cadeau de bienvenue : 1000 jetons pour tester
--   update public.profiles set tokens_balance = 1000 where id = v_user_id;
--
--   raise notice 'OK : utilisateur % promu admin avec 1000 jetons', v_user_id;
-- end $$;
