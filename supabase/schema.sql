-- EduardoPro · inventario, roles y control de acceso para Supabase
-- Ejecuta este archivo en:  Supabase → SQL Editor → New query → Run
-- Es idempotente: puedes volver a correrlo sin romper nada.

-- ─────────────────────────────────────────────────────────────────────────
-- 1 · Inventario
-- ─────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────
-- 2 · Quién trabaja aquí y con qué rol
--
--   admin     → manda: crea, edita, borra, cambia precios y visibilidad.
--   vendedor  → solo mueve existencias (sube y baja stock). Nada más.
--
-- Estar registrado NO da permisos: solo cuentan las filas de esta tabla, y
-- ninguna política permite escribir en ella. Dar de alta a alguien es un acto
-- deliberado desde el SQL Editor (paso 6, al final).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'vendedor')),
  email      text,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

-- Cada quien ve su propia fila; nadie ve la plantilla completa.
drop policy if exists "cada uno ve su propia ficha" on public.staff;
create policy "cada uno ve su propia ficha" on public.staff
  for select to authenticated
  using (user_id = (select auth.uid()));

-- security definer: estas funciones saltan RLS al mirar public.staff, para que
-- las políticas de products puedan preguntar por el rol sin quedar atrapadas
-- en las políticas de staff. Es el único salto y solo revelan el rol de quien
-- hace la petición, nunca el de otro.
create or replace function public.staff_role()
returns text
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from public.staff where user_id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.staff
     where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.staff where user_id = (select auth.uid())
  );
$$;

revoke all on function public.staff_role(), public.is_admin(), public.is_staff() from public;
grant execute on function public.staff_role(), public.is_admin(), public.is_staff()
  to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 3 · Políticas del inventario
--
-- RLS activo. Postgres deniega por defecto: lo que no esté escrito aquí no se
-- puede hacer, aunque la aplicación tuviera un fallo.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.products enable row level security;

-- Lectura pública: SOLO lo publicado. Un producto oculto es invisible para
-- quien no sea del equipo, aunque pida la fila por id.
drop policy if exists "publico lee productos activos" on public.products;
create policy "publico lee productos activos" on public.products
  for select to anon, authenticated
  using (active = true);

-- Las políticas SELECT se suman (OR): el equipo ve todo, incluido lo oculto.
-- El vendedor también, porque puede vender algo que no esté publicado.
drop policy if exists "el equipo lee todo" on public.products;
create policy "el equipo lee todo" on public.products
  for select to authenticated
  using (public.is_staff());

-- Crear, borrar y editar es SOLO del admin. El vendedor no tiene ninguna
-- política de escritura: no puede hacer UPDATE ni aunque lo intente a mano
-- contra la API. Su única vía para tocar el stock es la función del paso 4.
drop policy if exists "admin inserta" on public.products;
create policy "admin inserta" on public.products
  for insert to authenticated
  with check (public.is_admin());

-- using = qué filas puede tocar · with check = cómo pueden quedar después.
-- Hacen falta las dos: sin with check, se podría editar una fila y dejarla en
-- un estado que la política ya no permitiría.
drop policy if exists "admin actualiza" on public.products;
create policy "admin actualiza" on public.products
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin borra" on public.products;
create policy "admin borra" on public.products
  for delete to authenticated
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 4 · Mover existencias
--
-- RLS es a nivel de FILA, no de columna: no existe una política que diga
-- "puede cambiar stock pero no price". Por eso el vendedor no tiene UPDATE y
-- la única puerta es esta función, que por construcción solo escribe `stock`.
-- Aunque quisiera, no hay forma de expresar "cámbiame el precio" a través de
-- ella.
--
-- De paso arregla una carrera: hacerlo en una sola sentencia evita que dos
-- ventas simultáneas lean stock = 5 y ambas escriban 4.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.adjust_stock(p_id text, p_delta integer)
returns public.products
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated public.products;
begin
  if not public.is_staff() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  update public.products
     set stock = greatest(0, stock + p_delta)
   where id = p_id
  returning * into updated;

  return updated;  -- NULL si ese id no existe
end;
$$;

revoke all on function public.adjust_stock(text, integer) from public;
grant execute on function public.adjust_stock(text, integer) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 5 · Datos iniciales (los 4 productos actuales del sitio)
-- ─────────────────────────────────────────────────────────────────────────
insert into public.products (id, name, category, price, stock, image, active) values
  ('maquina-wahl',    'Máquina Wahl',      'Máquinas y cortadoras', 85,  8, '/products/maquina-wahl.png',    true),
  ('cera-rolda',      'Cera Rolda',        'Ceras y pomadas',       12, 24, '/products/cera-rolda.png',      true),
  ('minoxidil',       'Minoxidil',         'Cuidado de barba',      18, 15, '/products/minoxidil.png',       true),
  ('navaja-hojillas', 'Navaja + Hojillas', 'Navajas y afeitado',     9, 30, '/products/navaja-hojillas.png', true)
on conflict (id) do nothing;

-- Las categorías dejaron de escribirse a mano: ahora salen de una lista
-- cerrada, la de app/lib/categories.ts. Esto pasa las cuatro de antes —que
-- eran descripciones del producto, no categorías— a las de esa lista. Es
-- idempotente: la segunda vez no encuentra ninguna y no toca nada.
--
-- Si tienes productos con otras categorías escritas a mano, aquí no se tocan:
-- se siguen viendo y el selector las ofrece al final, marcadas como están, para
-- que puedas cambiarlas cuando edites el producto.
update public.products set category = case category
  when 'MÁQUINA PROFESIONAL'  then 'Máquinas y cortadoras'
  when 'CERA DE PEINADO MATE' then 'Ceras y pomadas'
  when 'CRECIMIENTO DE BARBA' then 'Cuidado de barba'
  when 'NAVAJA CON HOJILLAS'  then 'Navajas y afeitado'
end
where category in (
  'MÁQUINA PROFESIONAL',
  'CERA DE PEINADO MATE',
  'CRECIMIENTO DE BARBA',
  'NAVAJA CON HOJILLAS'
);

-- ─────────────────────────────────────────────────────────────────────────
-- 6 · Dar de alta a alguien
--
--   a) Crea el usuario:  Authentication → Users → Add user
--      Marca "Auto Confirm User" o no podrá entrar hasta verificar el correo.
--   b) Cambia el correo y el rol abajo y ejecuta SOLO esa línea.
--   c) Authentication → Providers → Email: desactiva "Enable sign-ups" para
--      que nadie pueda registrarse por su cuenta.
--
-- Para cambiarle el rol a alguien, vuelve a ejecutarlo con el rol nuevo: el
-- ON CONFLICT lo actualiza. Para darle de baja:
--   delete from public.staff where email = 'quien@ejemplo.com';
-- ─────────────────────────────────────────────────────────────────────────
-- insert into public.staff (user_id, role, email)
-- select id, 'admin', email from auth.users where email = 'TU-CORREO@ejemplo.com'
-- on conflict (user_id) do update set role = excluded.role;

-- insert into public.staff (user_id, role, email)
-- select id, 'vendedor', email from auth.users where email = 'VENDEDOR@ejemplo.com'
-- on conflict (user_id) do update set role = excluded.role;

-- ═════════════════════════════════════════════════════════════════════════
-- 7 · Ajustes del negocio (fila única)
--
-- La tasa Bs/USD se toma en vivo del BCV. Esto es SOLO el respaldo: si la API
-- se cae, el panel sigue funcionando con el último valor que fijó el admin.
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.settings (
  id                 smallint primary key default 1 check (id = 1),
  usd_to_bs_fallback numeric not null default 0 check (usd_to_bs_fallback >= 0),
  updated_at         timestamptz,
  updated_by         uuid references auth.users(id)
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

alter table public.settings enable row level security;

drop policy if exists "el equipo lee los ajustes" on public.settings;
create policy "el equipo lee los ajustes" on public.settings
  for select to authenticated
  using (public.is_staff());

drop policy if exists "el admin cambia los ajustes" on public.settings;
create policy "el admin cambia los ajustes" on public.settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═════════════════════════════════════════════════════════════════════════
-- 8 · Ventas
--
-- Cada venta congela la tasa y el precio unitario del momento. Si no, el
-- histórico se deformaría solo: subir un precio hoy reescribiría lo que
-- facturaste el mes pasado.
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  sold_at        timestamptz not null default now(),
  seller_id      uuid not null references auth.users(id),
  seller_email   text,
  payment_method text not null
    check (payment_method in ('usd_efectivo','bs_efectivo','pago_movil','transferencia','otro')),
  rate_usd_to_bs numeric not null check (rate_usd_to_bs > 0),
  rate_source    text not null check (rate_source in ('bcv','manual')),
  total_usd      numeric not null check (total_usd >= 0),
  note           text
);

create index if not exists sales_sold_at_idx on public.sales (sold_at desc);
create index if not exists sales_seller_idx  on public.sales (seller_id, sold_at desc);

create table if not exists public.sale_items (
  id             uuid primary key default gen_random_uuid(),
  sale_id        uuid not null references public.sales(id) on delete cascade,
  -- on delete set null: borrar un producto del catálogo no puede borrar el
  -- historial de lo que se vendió. Por eso el nombre va copiado abajo.
  product_id     text references public.products(id) on delete set null,
  product_name   text not null,
  qty            integer not null check (qty > 0),
  unit_price_usd numeric not null check (unit_price_usd >= 0)
);

create index if not exists sale_items_sale_idx on public.sale_items (sale_id);

alter table public.sales      enable row level security;
alter table public.sale_items enable row level security;

-- El admin ve la facturación entera; el vendedor solo lo que él mismo vendió
-- (lo justo para cuadrar su caja al cierre del turno).
drop policy if exists "admin ve todas las ventas" on public.sales;
create policy "admin ve todas las ventas" on public.sales
  for select to authenticated
  using (public.is_admin());

drop policy if exists "el vendedor ve sus ventas" on public.sales;
create policy "el vendedor ve sus ventas" on public.sales
  for select to authenticated
  using (seller_id = (select auth.uid()));

-- Las líneas heredan la visibilidad de su venta: si no puedes ver la venta,
-- no puedes ver lo que llevaba.
drop policy if exists "las lineas siguen a su venta" on public.sale_items;
create policy "las lineas siguen a su venta" on public.sale_items
  for select to authenticated
  using (exists (select 1 from public.sales s where s.id = sale_id));

-- Nadie escribe ventas directamente: ni INSERT, ni UPDATE, ni DELETE. La
-- única vía es register_sale(), que descuenta stock en la misma transacción.
-- Así no puede existir una venta sin su descuento, ni al revés.

-- ═════════════════════════════════════════════════════════════════════════
-- 9 · Registrar una venta
--
-- Todo o nada: si un solo renglón se queda sin stock, no se guarda nada.
-- El UPDATE lleva la condición `stock >= qty` dentro, así que dos cajas
-- vendiendo la última unidad a la vez no pueden dejar el stock en negativo:
-- la segunda no encuentra fila que actualizar y la venta entera se revierte.
-- ═════════════════════════════════════════════════════════════════════════
-- La función vive en la sección 14, no aquí: necesita las columnas
-- sale_items.unit_cost_usd y sales.seller_role, que se añaden allí. Tenerla
-- dos veces en este archivo era una trampa — se editaba la copia muerta.
--
-- Lo que NO cambia y conviene tener presente al leerla: nadie escribe ventas
-- directamente. No hay política de INSERT sobre sales ni sale_items, así que
-- register_sale() es la única puerta y el descuento de stock viaja en su
-- misma transacción.

-- ═════════════════════════════════════════════════════════════════════════
-- 10 · Imágenes de productos (Supabase Storage)
--
-- Bucket público: las fotos salen en la web, así que servirlas por URL firmada
-- solo añadiría latencia y complicaría el caché. Público es SOLO para leer —
-- subir, reemplazar y borrar sigue siendo del admin.
--
-- El límite de 3 MB y la lista de tipos los aplica el propio Storage: la
-- validación del formulario se puede saltar, esto no.
-- ═════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'productos', 'productos', true, 3145728,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "las fotos de productos son publicas" on storage.objects;
create policy "las fotos de productos son publicas" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'productos');

drop policy if exists "el admin sube fotos" on storage.objects;
create policy "el admin sube fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "el admin reemplaza fotos" on storage.objects;
create policy "el admin reemplaza fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and public.is_admin())
  with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "el admin borra fotos" on storage.objects;
create policy "el admin borra fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and public.is_admin());

-- ═════════════════════════════════════════════════════════════════════════
-- 11 · Costo de los productos
--
-- El inventario guarda el precio de VENTA (`price`) y el de COMPRA
-- (`cost_usd`). Base elegida: ÚLTIMO COSTO — cost_usd es el de la compra más
-- reciente. Cada línea de compra conserva además su costo real, así que el
-- histórico no se pierde aunque el costo actual cambie.
-- ═════════════════════════════════════════════════════════════════════════
alter table public.products
  add column if not exists cost_usd numeric not null default 0
  check (cost_usd >= 0);

-- ═════════════════════════════════════════════════════════════════════════
-- 12 · Compras a proveedor
--
-- Registrar una compra SUMA existencias y fija el costo. Es la operación
-- inversa a una venta, y como aquella, todo pasa por una función: no puede
-- existir una compra sin su entrada de stock.
--
-- Solo el admin: registrar una compra obliga a ver costos y márgenes, que es
-- exactamente lo que se le oculta al vendedor.
-- ═════════════════════════════════════════════════════════════════════════
create table if not exists public.purchases (
  id             uuid primary key default gen_random_uuid(),
  bought_at      timestamptz not null default now(),
  buyer_id       uuid not null references auth.users(id),
  buyer_email    text,
  supplier       text,
  rate_usd_to_bs numeric not null check (rate_usd_to_bs > 0),
  rate_source    text not null check (rate_source in ('bcv','manual')),
  total_usd      numeric not null check (total_usd >= 0),
  note           text
);

create index if not exists purchases_bought_at_idx on public.purchases (bought_at desc);

create table if not exists public.purchase_items (
  id             uuid primary key default gen_random_uuid(),
  purchase_id    uuid not null references public.purchases(id) on delete cascade,
  product_id     text references public.products(id) on delete set null,
  product_name   text not null,
  qty            integer not null check (qty > 0),
  unit_cost_usd  numeric not null check (unit_cost_usd >= 0),
  -- Precio de venta que quedó fijado con esta compra. Guardarlo permite ver
  -- después con qué margen se compró, aunque el precio haya cambiado luego.
  sale_price_usd numeric check (sale_price_usd is null or sale_price_usd >= 0)
);

create index if not exists purchase_items_purchase_idx on public.purchase_items (purchase_id);

alter table public.purchases      enable row level security;
alter table public.purchase_items enable row level security;

drop policy if exists "solo el admin ve las compras" on public.purchases;
create policy "solo el admin ve las compras" on public.purchases
  for select to authenticated
  using (public.is_admin());

drop policy if exists "las lineas siguen a su compra" on public.purchase_items;
create policy "las lineas siguen a su compra" on public.purchase_items
  for select to authenticated
  using (exists (select 1 from public.purchases p where p.id = purchase_id));

-- Sin políticas de escritura: la única vía es register_purchase().

-- ═════════════════════════════════════════════════════════════════════════
-- 13 · Registrar una compra
--
-- Por cada renglón: suma stock, fija el costo y —si se indicó— el precio de
-- venta. Todo en una transacción, igual que la venta.
--
-- Los productos nuevos se crean ANTES desde la aplicación (allí vive la
-- generación del identificador), y aquí llegan ya con su id.
-- ═════════════════════════════════════════════════════════════════════════
create or replace function public.register_purchase(
  p_items    jsonb,   -- [{"product_id":"…","qty":10,"unit_cost":5.5,"sale_price":9}, …]
  p_supplier text,
  p_rate     numeric,
  p_source   text,
  p_note     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_purchase_id uuid;
  v_item        jsonb;
  v_qty         integer;
  v_cost        numeric;
  v_price       numeric;
  v_prod        public.products;
  v_total       numeric := 0;
  v_email       text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_rate is null or p_rate <= 0 then
    raise exception 'Tasa inválida';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra no tiene renglones';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into public.purchases (buyer_id, buyer_email, supplier,
                                rate_usd_to_bs, rate_source, total_usd, note)
  values (auth.uid(), v_email, nullif(btrim(coalesce(p_supplier, '')), ''),
          p_rate, p_source, 0, nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty   := (v_item->>'qty')::int;
    v_cost  := (v_item->>'unit_cost')::numeric;
    v_price := nullif(v_item->>'sale_price', '')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida';
    end if;
    if v_cost is null or v_cost < 0 then
      raise exception 'Costo inválido';
    end if;

    -- Suma stock y fija el costo. coalesce en price: si no se indicó precio
    -- de venta nuevo, se respeta el que ya tenía.
    update public.products
       set stock    = stock + v_qty,
           cost_usd = v_cost,
           price    = coalesce(v_price, price)
     where id = (v_item->>'product_id')
    returning * into v_prod;

    if v_prod.id is null then
      raise exception 'El producto "%" no existe', v_item->>'product_id';
    end if;

    insert into public.purchase_items
      (purchase_id, product_id, product_name, qty, unit_cost_usd, sale_price_usd)
    values (v_purchase_id, v_prod.id, v_prod.name, v_qty, v_cost, v_prod.price);

    v_total := v_total + (v_cost * v_qty);
  end loop;

  update public.purchases set total_usd = v_total where id = v_purchase_id;
  return v_purchase_id;
end;
$$;

revoke all on function public.register_purchase(jsonb, text, numeric, text, text) from public;
grant execute on function public.register_purchase(jsonb, text, numeric, text, text) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════
-- 14 · Lo que se congela en la venta: costo y rol de quien vendió
--
-- El costo, porque sin él el margen del histórico se deformaría igual que se
-- deformaría el precio: al comprar más caro el mes que viene, las ventas de
-- este mes parecerían haber ganado menos de lo que ganaron.
--
-- El rol, porque no se puede deducir después. La política de staff solo deja
-- a cada quien ver SU propia ficha, así que un join devolvería vacío para las
-- ventas de los demás. Y aunque se pudiera consultar, ascender a alguien
-- reescribiría quién era cuando vendió.
-- ═════════════════════════════════════════════════════════════════════════
alter table public.sale_items
  add column if not exists unit_cost_usd numeric not null default 0
  check (unit_cost_usd >= 0);

alter table public.sales
  add column if not exists seller_role text
  check (seller_role is null or seller_role in ('admin', 'vendedor'));

-- Relleno para las ventas que ya existían. Queda NULL si esa persona ya no
-- está en la plantilla; la UI lo muestra como "—" en vez de inventarlo.
update public.sales s
   set seller_role = st.role
  from public.staff st
 where st.user_id = s.seller_id
   and s.seller_role is null;

create or replace function public.register_sale(
  p_items   jsonb,
  p_payment text,
  p_rate    numeric,
  p_source  text,
  p_note    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sale_id uuid;
  v_item    jsonb;
  v_qty     integer;
  v_prod    public.products;
  v_total   numeric := 0;
  v_email   text;
  v_role    text;
begin
  if not public.is_staff() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_rate is null or p_rate <= 0 then
    raise exception 'Tasa inválida';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene renglones';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  v_role := public.staff_role();

  insert into public.sales (seller_id, seller_email, seller_role, payment_method,
                            rate_usd_to_bs, rate_source, total_usd, note)
  values (auth.uid(), v_email, v_role, p_payment, p_rate, p_source, 0,
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida';
    end if;

    update public.products
       set stock = stock - v_qty
     where id = (v_item->>'product_id')
       and stock >= v_qty
    returning * into v_prod;

    if v_prod.id is null then
      raise exception 'Sin stock suficiente para "%"',
        coalesce((select name from public.products
                   where id = (v_item->>'product_id')),
                 v_item->>'product_id');
    end if;

    insert into public.sale_items
      (sale_id, product_id, product_name, qty, unit_price_usd, unit_cost_usd)
    values (v_sale_id, v_prod.id, v_prod.name, v_qty, v_prod.price, v_prod.cost_usd);

    v_total := v_total + (v_prod.price * v_qty);
  end loop;

  update public.sales set total_usd = v_total where id = v_sale_id;
  return v_sale_id;
end;
$$;

revoke all on function public.register_sale(jsonb, text, numeric, text, text) from public;
grant execute on function public.register_sale(jsonb, text, numeric, text, text) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════
-- 15 · Dar de alta y de baja desde el panel
--
-- Hasta aquí, repartir permisos era un acto manual desde este editor. Esta
-- sección lo abre a la pantalla de Ajustes, y lo hace en DOS mitades a
-- propósito:
--
--   · Crear la cuenta en auth.users la hace la aplicación con la clave
--     SECRETA, porque la Admin API de Supabase no acepta otra cosa. Esa clave
--     se salta RLS entera, así que toca lo mínimo: una llamada, un archivo
--     (app/lib/supabase/admin.ts) y nada más.
--   · Repartir el ROL lo hacen estas dos funciones, con la sesión normal de
--     quien pulsa el botón. Siguen el patrón de register_sale y adjust_stock:
--     security definer para poder escribir donde nadie tiene permiso, y
--     is_admin() en la primera línea como única puerta.
--
-- Es decir: la tabla staff sigue teniendo a RLS como autoridad. La clave
-- secreta no la toca.
-- ═════════════════════════════════════════════════════════════════════════

-- Quién dio de alta a quién. En un sitio donde se reparten permisos, poder
-- mirar atrás vale mucho más de lo que cuesta la columna.
alter table public.staff
  add column if not exists created_by uuid references auth.users(id);

-- El admin necesita ver la plantilla entera para gestionarla. La política de
-- "cada uno ve su propia ficha" sigue viva: las dos se suman, no se pisan.
drop policy if exists "el admin ve la plantilla" on public.staff;
create policy "el admin ve la plantilla" on public.staff
  for select to authenticated
  using (public.is_admin());

-- Sigue sin haber política de INSERT, UPDATE ni DELETE sobre staff: la única
-- vía son estas dos funciones.

create or replace function public.grant_staff(
  p_user_id uuid,
  p_role    text,
  p_email   text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'vendedor') then
    raise exception 'Rol inválido';
  end if;
  -- Nadie se cambia el rol a sí mismo. Sin esto, un admin puede degradarse
  -- por error y dejar el negocio sin nadie que pueda arreglarlo.
  if p_user_id = (select auth.uid()) then
    raise exception 'No puedes cambiarte el rol a ti mismo';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Esa cuenta no existe';
  end if;

  insert into public.staff (user_id, role, email, created_by)
  values (p_user_id, p_role, p_email, (select auth.uid()))
  on conflict (user_id) do update
    set role  = excluded.role,
        email = coalesce(excluded.email, public.staff.email);
end;
$$;

create or replace function public.revoke_staff(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  -- Ni darse de baja a uno mismo: es la forma más fácil de quedarse fuera del
  -- panel sin nadie dentro que te vuelva a meter.
  if p_user_id = (select auth.uid()) then
    raise exception 'No puedes darte de baja a ti mismo';
  end if;

  delete from public.staff where user_id = p_user_id;
end;
$$;

revoke all on function public.grant_staff(uuid, text, text) from public;
revoke all on function public.revoke_staff(uuid)            from public;
grant execute on function public.grant_staff(uuid, text, text) to authenticated;
grant execute on function public.revoke_staff(uuid)            to authenticated;
