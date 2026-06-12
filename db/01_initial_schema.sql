-- ============================================================================
-- VOHITRA — Schema SQL initial
-- À exécuter dans Supabase : SQL Editor > New Query > Coller > Run
-- ============================================================================
-- Philosophie de sécurité :
-- - Toutes les tables ont RLS activé
-- - Aucune policy "permissive" : par défaut, le navigateur ne peut RIEN faire
-- - L'accès passe par nos Server Actions Next.js avec la service_role key
-- - Cette key vit UNIQUEMENT côté serveur, jamais exposée au navigateur
-- ============================================================================

-- 1. TABLE profiles ----------------------------------------------------------
-- Étend auth.users avec les données métier (nom, téléphone, jetons...)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text not null,
  tokens_balance integer not null default 0 check (tokens_balance >= 0),
  is_kyc_verified boolean not null default false,
  cgu_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour les recherches
create index if not exists profiles_email_idx on public.profiles(email);

-- RLS activé, AUCUNE policy => verrouillé pour le client
alter table public.profiles enable row level security;

-- 2. TABLE user_roles --------------------------------------------------------
-- Un utilisateur peut avoir plusieurs rôles (ex: admin + proprietaire)
create type if not exists public.app_role as enum ('locataire', 'proprietaire', 'admin');

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

-- 3. TABLE site_settings -----------------------------------------------------
-- Paramètres globaux contrôlés par l'admin (ligne unique id=1)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  token_price integer not null default 5000,                  -- prix d'1 jeton en Ar
  unlock_cost integer not null default 1,                     -- coût déblocage contact en jetons
  verification_cost integer not null default 10,              -- coût demande vérification en jetons
  boost_cost integer not null default 5,                      -- coût boost premium en jetons
  boost_duration_days integer not null default 7,             -- durée du boost en jours
  free_mode_until timestamptz,                                -- mode "tout gratuit" jusqu'à cette date
  purchase_instructions text not null default 'Envoyez votre paiement Mvola/Orange Money/Airtel au numéro 034 00 000 00 puis collez la référence de transaction ci-dessous.',
  updated_at timestamptz not null default now()
);

-- Insertion de la ligne unique par défaut
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- Lecture seule autorisée pour les settings (utile à afficher le prix sur la page tokens)
create policy "settings_select_anyone" on public.site_settings
  for select using (true);

-- 4. TRIGGER : créer un profile automatiquement à chaque inscription -------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, cgu_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sans nom'),
    new.raw_user_meta_data->>'phone',
    new.email,
    case
      when new.raw_user_meta_data->>'cgu_accepted_at' is not null
      then (new.raw_user_meta_data->>'cgu_accepted_at')::timestamptz
      else null
    end
  );

  -- Attribution du rôle (locataire par défaut si pas spécifié)
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'locataire')::public.app_role
  );

  return new;
end;
$$;

-- Lier le trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. TRIGGER : mise à jour automatique de updated_at -------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.site_settings;
create trigger settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- FIN DU SCHEMA INITIAL
-- ============================================================================
-- Vérifications après exécution :
-- 1. Aller dans Authentication > Users : vide pour l'instant
-- 2. Aller dans Table Editor : voir profiles, user_roles, site_settings
-- 3. Aller dans Database > Triggers : voir on_auth_user_created
-- ============================================================================
