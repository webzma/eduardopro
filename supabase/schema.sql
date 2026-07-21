-- EduardoPro · esquema de inventario para Supabase
-- Ejecuta este archivo en:  Supabase → SQL Editor → New query → Run

create table if not exists public.products (
  id         text primary key,
  name       text not null,
  category   text not null default '',
  price      numeric not null default 0,
  stock      integer not null default 0,
  image      text not null default '/products/placeholder.svg',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS activado y SIN políticas públicas: todo el acceso pasa por el servidor
-- (Server Actions / server components) usando la service_role key, que
-- ignora RLS. Así la tabla no es accesible directamente desde el navegador.
alter table public.products enable row level security;

-- Datos iniciales (los 4 productos actuales del sitio).
insert into public.products (id, name, category, price, stock, image, active) values
  ('maquina-wahl',    'Máquina Wahl',      'MÁQUINA PROFESIONAL', 85,  8, '/products/maquina-wahl.png',    true),
  ('cera-rolda',      'Cera Rolda',        'CERA DE PEINADO MATE', 12, 24, '/products/cera-rolda.png',      true),
  ('minoxidil',       'Minoxidil',         'CRECIMIENTO DE BARBA', 18, 15, '/products/minoxidil.png',       true),
  ('navaja-hojillas', 'Navaja + Hojillas', 'NAVAJA CON HOJILLAS',   9, 30, '/products/navaja-hojillas.png', true)
on conflict (id) do nothing;
