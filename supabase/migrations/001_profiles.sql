-- ═══════════════════════════════════════════════════════
-- KYŌRA — Migración 001: Tabla profiles
-- Extiende auth.users con datos de suscripción (Lemon Squeezy).
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- Tabla principal de perfiles/suscripciones
create table if not exists public.profiles (
  id                   uuid references auth.users(id) on delete cascade primary key,
  plan                 text not null default 'esencial'
                         check (plan in ('esencial', 'premium', 'elite')),
  ls_customer_id       text,
  ls_subscription_id   text,
  subscription_status  text not null default 'inactive',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Índices
create index if not exists profiles_ls_customer_id_idx on public.profiles(ls_customer_id);
create index if not exists profiles_ls_subscription_id_idx on public.profiles(ls_subscription_id);

-- ── Row Level Security ────────────────────────────────
alter table public.profiles enable row level security;

-- Usuarios solo pueden leer su propio perfil
create policy "usuarios leen su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Service role tiene acceso total (usado por el webhook)
create policy "service role acceso total"
  on public.profiles
  using (auth.role() = 'service_role');

-- ── Triggers ─────────────────────────────────────────

-- Auto-crear perfil cuando un usuario se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, plan)
  values (new.id, 'esencial')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-actualizar updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Backfill: crear perfil para usuarios existentes ──
insert into public.profiles (id, plan)
select id, 'esencial'
from auth.users
on conflict (id) do nothing;
