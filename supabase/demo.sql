-- EduardoPro · datos de prueba
-- Ejecuta este archivo en:  Supabase → SQL Editor → New query → Run
--
-- Llena el catálogo, las compras y las ventas para poder ver el sitio y el
-- panel con volumen: tablas largas, filtros con datos en todos los periodos,
-- stock bajo, productos agotados y ocultos, márgenes flojos, pagos de los
-- cinco tipos. Lo que hace falta para probar de verdad, en vez de con tres
-- filas donde todo se ve bien.
--
-- TODO LO QUE CREA VA MARCADO, para poder quitarlo sin tocar lo real:
--   · productos        → id que empieza por 'demo-'
--   · ventas y compras → nota que empieza por '[demo]'
--
-- Volver a ejecutarlo no duplica nada: lo primero que hace es borrar la tanda
-- anterior. Para quitarlo todo y no volver, ejecuta solo el bloque 6.
--
-- Por qué escribe directo en las tablas y no por register_sale() /
-- register_purchase(): esas funciones exigen auth.uid(), y en el SQL Editor no
-- hay sesión de nadie. La consecuencia es buscada — al no pasar por ellas, los
-- movimientos NO tocan el stock, así que el stock de cada producto es el que
-- se fija abajo y se pueden dejar a propósito los casos que hay que ver:
-- agotado, quedan dos, oculto del sitio público.

-- ─────────────────────────────────────────────────────────────────────────
-- 0 · Hace falta alguien en public.staff: las ventas y compras se cuelgan de
--     una persona real (seller_id y buyer_id apuntan a auth.users).
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from public.staff where role = 'admin') then
    raise exception
      'No hay ningún admin en public.staff. Haz primero el paso 6 de schema.sql.';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 1 · Fuera la tanda anterior (borrar la venta se lleva sus renglones)
-- ─────────────────────────────────────────────────────────────────────────
delete from public.sales     where note like '[demo]%';
delete from public.purchases where note like '[demo]%';
delete from public.products  where id like 'demo-%';

-- ─────────────────────────────────────────────────────────────────────────
-- 2 · Catálogo
--
-- Las categorías son las de app/lib/categories.ts: si aquí apareciera una que
-- no está en esa lista, el selector del panel la marcaría como categoría vieja.
--
-- Las fotos se reparten entre las cuatro que hay en /public/products: son
-- datos de prueba, no un catálogo real. Dos productos se quedan con el
-- marcador de posición a propósito, para ver cómo se comporta esa ficha.
--
-- El stock está elegido, no calculado: 0 en dos productos (agotado), 1-3 en
-- otros tres (aviso ámbar), y dos productos con active = false para ver la
-- diferencia entre el panel y el sitio público.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.products
  (id, name, category, price, cost_usd, stock, image, active, created_at)
values
  ('demo-maquina-babyliss',  'Máquina Babyliss FX870',        'Máquinas y cortadoras',   189,  132,   7, '/products/maquina-wahl.png',    true,  now() - interval '84 days'),
  ('demo-maquina-andis',     'Cortadora Andis Master',        'Máquinas y cortadoras',   145,   98,   4, '/products/maquina-wahl.png',    true,  now() - interval '82 days'),
  ('demo-trimmer-wahl',      'Trimmer Wahl Detailer',         'Máquinas y cortadoras',    96,   64,  11, '/products/maquina-wahl.png',    true,  now() - interval '80 days'),
  ('demo-tijera-pro',        'Tijera profesional 6"',         'Tijeras',                  42,   26,   9, '/products/placeholder.svg',     true,  now() - interval '76 days'),
  ('demo-tijera-entresacar', 'Tijera de entresacar',          'Tijeras',                  38,   23,   2, '/products/placeholder.svg',     true,  now() - interval '75 days'),
  ('demo-navaja-barbero',    'Navaja de barbero clásica',     'Navajas y afeitado',       16,    8.5, 18, '/products/navaja-hojillas.png', true,  now() - interval '70 days'),
  ('demo-hojillas-derby',    'Hojillas Derby x100',           'Navajas y afeitado',       11,    5.5, 42, '/products/navaja-hojillas.png', true,  now() - interval '69 days'),
  ('demo-espuma-proraso',    'Espuma de afeitar Proraso',     'Navajas y afeitado',        9.5,  5,   26, '/products/navaja-hojillas.png', true,  now() - interval '66 days'),
  ('demo-aceite-barba',      'Aceite para barba 30 ml',       'Cuidado de barba',         14,    7,   31, '/products/minoxidil.png',       true,  now() - interval '62 days'),
  ('demo-balsamo-barba',     'Bálsamo moldeador de barba',    'Cuidado de barba',         13,    6.5,  0, '/products/minoxidil.png',       true,  now() - interval '60 days'),
  ('demo-minoxidil-kit',     'Kit minoxidil 3 meses',         'Cuidado de barba',         45,   28,   6, '/products/minoxidil.png',       true,  now() - interval '58 days'),
  ('demo-cera-mate',         'Cera mate fijación fuerte',     'Ceras y pomadas',          12,    6,   54, '/products/cera-rolda.png',      true,  now() - interval '54 days'),
  ('demo-pomada-brillo',     'Pomada con brillo 100 g',       'Ceras y pomadas',          13.5,  7,   23, '/products/cera-rolda.png',      true,  now() - interval '52 days'),
  -- Margen del 8 %: la columna del inventario lo marca en rojo y dice "bajo".
  ('demo-gel-fijador',       'Gel fijador extra fuerte',      'Ceras y pomadas',           8,    7.4, 17, '/products/cera-rolda.png',      true,  now() - interval '50 days'),
  ('demo-shampoo-anticaspa', 'Shampoo anticaspa 400 ml',      'Shampoo y tratamientos',   15,    8,   12, '/products/placeholder.svg',     true,  now() - interval '46 days'),
  ('demo-tonico-capilar',    'Tónico capilar fortalecedor',   'Shampoo y tratamientos',   19,   11,    3, '/products/minoxidil.png',       true,  now() - interval '44 days'),
  ('demo-tinte-barba',       'Tinte para barba negro',        'Tintes y coloración',      10,    5,   21, '/products/placeholder.svg',     true,  now() - interval '40 days'),
  ('demo-peine-carbono',     'Peine de carbono antiestático', 'Peines y cepillos',         6,    2.4, 65, '/products/placeholder.svg',     true,  now() - interval '36 days'),
  ('demo-cepillo-fade',      'Cepillo de fade',               'Peines y cepillos',         7.5,  3.2, 29, '/products/placeholder.svg',     true,  now() - interval '34 days'),
  ('demo-capa-corte',        'Capa de corte impermeable',     'Capas y accesorios',       22,   12,    8, '/products/placeholder.svg',     true,  now() - interval '30 days'),
  ('demo-cuellos-papel',     'Cuellos de papel x100',         'Capas y accesorios',        9,    4,   37, '/products/placeholder.svg',     true,  now() - interval '28 days'),
  ('demo-alcohol-barbero',   'Alcohol de barbero 500 ml',     'Higiene y desinfección',    8.5,  4.2, 44, '/products/placeholder.svg',     true,  now() - interval '24 days'),
  -- Oculto del sitio público, visible en el panel.
  ('demo-spray-cuchillas',   'Spray desinfectante 5 en 1',    'Higiene y desinfección',   12,    6.5, 15, '/products/placeholder.svg',     false, now() - interval '20 days'),
  ('demo-cuchilla-repuesto', 'Cuchilla de repuesto universal','Repuestos y cuchillas',    18,    9.5,  1, '/products/placeholder.svg',     true,  now() - interval '16 days'),
  ('demo-muelle-maquina',    'Muelle y tornillería de máquina','Repuestos y cuchillas',    5,    1.9,  0, '/products/placeholder.svg',     false, now() - interval '12 days');

-- ─────────────────────────────────────────────────────────────────────────
-- 3 · Compras · 14 pedidos repartidos en los últimos ~3 meses
--
-- La tasa sube según se acerca a hoy, que es lo que hace el bolívar: así el
-- histórico en Bs no sale plano y se ve para qué sirve congelarla en cada
-- documento. Una de cada siete va con tasa manual, para ver la etiqueta de
-- "Respaldo manual" en la ficha.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.purchases
  (bought_at, buyer_id, buyer_email, supplier, rate_usd_to_bs, rate_source, total_usd, note)
select
  least(
    now() - interval '5 minutes',
    (current_date - (g * 6))::timestamptz + interval '13 hours'
      + (random() * interval '4 hours')
  ),
  a.user_id,
  a.email,
  (array['Distribuidora El Barbero',
         'Suministros Capilares CA',
         'Importadora Style',
         'Mayorista Andina',
         'Barber Supply Valera'])[1 + (g % 5)],
  round((758 - g * 2.4 + random() * 3)::numeric, 4),
  case when g % 7 = 0 then 'manual' else 'bcv' end,
  0,   -- se calcula abajo, cuando ya existen los renglones
  '[demo] reposición de mercancía'
from generate_series(0, 13) g
-- Comprar es cosa del admin: el vendedor ni siquiera ve esta pantalla. Si hay
-- varios, se van turnando — de ahí el módulo, y no un `order by random()
-- limit 1`, que se evalúa UNA vez para toda la consulta y le colgaría las
-- catorce compras a la misma persona.
cross join lateral (
  select a.user_id, a.email from (
    select st.user_id,
           coalesce(st.email, u.email) as email,
           row_number() over (order by st.user_id) as rn,
           count(*) over () as total
      from public.staff st
      join auth.users u on u.id = st.user_id
     where st.role = 'admin'
  ) a
  where a.rn = 1 + (g % a.total)
) a;

-- De 1 a 4 renglones por compra, con el costo bailando un ±8 % alrededor del
-- costo del catálogo: cada compra trae su precio, no el de la lista.
--
-- El número de renglones se decide con un row_number() y no con un
-- "limit (1 + random()*4)": PostgreSQL evalúa la expresión del LIMIT una sola
-- vez para todo el nodo, así que esa forma —que parece la natural— salía con
-- un único renglón en las catorce compras. Numerar y cortar por el número sí
-- se recalcula en cada vuelta del lateral.
insert into public.purchase_items
  (purchase_id, product_id, product_name, qty, unit_cost_usd, sale_price_usd)
select
  p.id,
  pr.id,
  pr.name,
  (2 + floor(random() * 10))::int,
  round((pr.cost_usd * (0.92 + random() * 0.16))::numeric, 2),
  pr.price
from public.purchases p
cross join lateral (
  select prod.*,
         -- El orden y el corte salen del id de LA compra: así el lateral
         -- depende de la fila de fuera y se recalcula en cada vuelta.
         row_number() over (order by md5(prod.id || p.id::text)) as rn
    from public.products prod
   where prod.id like 'demo-%'
) pr
where p.note like '[demo]%'
  and pr.rn <= 1 + (get_byte(decode(md5(p.id::text), 'hex'), 0) % 4);

update public.purchases p
   set total_usd = coalesce((
         select sum(i.qty * i.unit_cost_usd)
           from public.purchase_items i
          where i.purchase_id = p.id
       ), 0)
 where p.note like '[demo]%';

-- ─────────────────────────────────────────────────────────────────────────
-- 4 · Ventas · 80 tickets
--
-- Reparto pensado para los filtros de periodo: las 20 primeras caen en los
-- últimos 7 días (para que "Hoy" y "7 días" tengan carne) y el resto se
-- extiende sobre 36 días, así "Este mes" y "Todo" también se llenan.
--
-- Si hay un vendedor dado de alta, la mitad de los tickets salen a su nombre:
-- es la forma de comprobar que él solo ve los suyos y el admin los ve todos.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.sales
  (sold_at, seller_id, seller_email, seller_role, payment_method,
   rate_usd_to_bs, rate_source, total_usd, note)
select
  least(
    now() - interval '5 minutes',
    (current_date - t.d)::timestamptz + interval '12 hours'
      + (random() * interval '11 hours')
  ),
  s.user_id,
  s.email,
  s.role,
  -- Pesos parecidos a los de un mostrador: el efectivo en dólares y el pago
  -- móvil se llevan la mayoría. Repartido por el número de ticket y no al
  -- azar, para que las cinco formas de pago salgan seguro — con random() la
  -- muestra puede dejarse alguna fuera y quedan pantallas sin probar.
  case
    when (g % 20) < 8  then 'usd_efectivo'
    when (g % 20) < 14 then 'pago_movil'
    when (g % 20) < 17 then 'bs_efectivo'
    when (g % 20) < 19 then 'transferencia'
    else 'otro'
  end,
  round((758 - t.d * 0.9 + random() * 3)::numeric, 4),
  case when g % 11 = 0 then 'manual' else 'bcv' end,
  0,
  '[demo] venta de mostrador'
from generate_series(1, 80) g
cross join lateral (
  select case when g <= 20 then (g % 7) else ((g * 13) % 36) end as d
) t
-- Los tickets se turnan entre toda la plantilla. Con un solo admin dado de
-- alta salen todos suyos; en cuanto haya un vendedor, la mitad son de él.
cross join lateral (
  select s.user_id, s.email, s.role from (
    select st.user_id,
           coalesce(st.email, u.email) as email,
           st.role,
           row_number() over (order by st.role, st.user_id) as rn,
           count(*) over () as total
      from public.staff st
      join auth.users u on u.id = st.user_id
  ) s
  where s.rn = 1 + (g % s.total)
) s;

-- De 1 a 3 productos por ticket. El costo unitario se copia del producto: sin
-- él, la ganancia del mes saldría inflada y el panel lo avisaría en ámbar.
insert into public.sale_items
  (sale_id, product_id, product_name, qty, unit_price_usd, unit_cost_usd)
select
  s.id,
  pr.id,
  pr.name,
  (1 + floor(random() * 3))::int,
  pr.price,
  pr.cost_usd
from public.sales s
cross join lateral (
  select prod.*,
         row_number() over (order by md5(prod.id || s.id::text)) as rn
    from public.products prod
   where prod.id like 'demo-%' and prod.active
) pr
where s.note like '[demo]%'
  and pr.rn <= 1 + (get_byte(decode(md5(s.id::text), 'hex'), 0) % 3);

update public.sales s
   set total_usd = coalesce((
         select sum(i.qty * i.unit_price_usd)
           from public.sale_items i
          where i.sale_id = s.id
       ), 0)
 where s.note like '[demo]%';

-- ─────────────────────────────────────────────────────────────────────────
-- 5 · Tasa de respaldo, para que Ajustes no salga vacío
--
-- Esto NO va marcado como demo: es el ajuste real del negocio. Cámbialo desde
-- el panel cuando quieras; el bloque 6 no lo toca.
-- ─────────────────────────────────────────────────────────────────────────
update public.settings
   set usd_to_bs_fallback = 756.7083,
       updated_at = now() - interval '2 days',
       updated_by = (select user_id from public.staff where role = 'admin' limit 1)
 where id = 1;

-- Qué quedó
select
  (select count(*) from public.products  where id like 'demo-%')   as productos,
  (select count(*) from public.purchases where note like '[demo]%') as compras,
  (select count(*) from public.sales     where note like '[demo]%') as ventas,
  (select count(*) from public.sale_items i
     join public.sales sa on sa.id = i.sale_id
    where sa.note like '[demo]%')                                   as renglones_vendidos;

-- ═════════════════════════════════════════════════════════════════════════
-- 6 · Borrar los datos de prueba
--
-- Ejecuta SOLO estas tres líneas (quitándoles el comentario) cuando ya no las
-- necesites. En este orden: las ventas y compras primero, porque borrar un
-- producto que sale en un ticket no borra el ticket — le deja el nombre
-- copiado y el enlace en nulo, que es justo lo que no quieres al limpiar.
-- ═════════════════════════════════════════════════════════════════════════
-- delete from public.sales     where note like '[demo]%';
-- delete from public.purchases where note like '[demo]%';
-- delete from public.products  where id like 'demo-%';
