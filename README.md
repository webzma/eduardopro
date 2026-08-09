This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Inventario y acceso (Supabase)

El catálogo público y el panel `/admin` leen la tabla `public.products`. Quién puede
ver y tocar qué lo decide **RLS dentro de la base**, no la aplicación:

| Quién | Puede |
| --- | --- |
| Visitante anónimo | Leer solo los productos con `active = true` |
| Sesión sin rol | Lo mismo que un anónimo |
| `vendedor` | Ver el catálogo completo, registrar ventas, corregir existencias y ver **sus propias** ventas |
| `admin` | Todo lo anterior más crear, editar, cambiar precios, ocultar, borrar, ver la facturación completa y fijar la tasa |

El rol sale de `public.staff`. Un detalle que conviene saber: **RLS es a nivel de
fila, no de columna**, así que no existe una política que diga "puede cambiar
stock pero no precio". Por eso el vendedor no tiene permiso de `UPDATE` en
absoluto y su única vía es la función `adjust_stock()`, que por construcción solo
escribe esa columna — y de paso hace el ajuste de forma atómica, evitando que dos
ventas simultáneas se pisen.

La app usa **únicamente la publishable key**. No hay ninguna clave que ignore RLS en
el código, así que un fallo en la aplicación no puede convertirse en escritura no
autorizada — la base rechaza igual.

### Puesta en marcha

1. **Esquema:** Supabase → SQL Editor → New query → pega y ejecuta
   `supabase/schema.sql`. Crea las tablas, activa RLS, escribe las políticas y
   carga los 4 productos iniciales. Es idempotente.
2. **Variables en `.env.local`:**

   | Variable | De dónde sale |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable (`sb_publishable_…`) |

   Nunca pongas la *secret key* aquí: las variables `NEXT_PUBLIC_` viajan al
   navegador, y esa clave se salta RLS. El arranque lo comprueba y falla si la
   detecta.
3. **Crea tu usuario:** Authentication → Users → Add user. Marca **Auto Confirm
   User** o no podrás entrar hasta verificar el correo.
4. **Date permiso de admin:** descomenta el bloque final de `supabase/schema.sql`,
   pon tu correo y ejecútalo. Registrarse no da permisos: solo cuentan las filas
   de `public.admins`, y ninguna política permite escribir en esa tabla desde la
   aplicación.
5. **Cierra el registro público:** Authentication → Providers → Email → desactiva
   *Enable sign-ups*.
6. Reinicia `npm run dev` después de tocar `.env.local`.

## El panel

```
/admin                    Resumen — KPIs del día y del mes, ganancia, stock bajo
/admin/ventas/nueva       Registrar venta (carrito, método de pago, totales en vivo)
/admin/ventas             Historial · /admin/ventas/[id] detalle
/admin/compras/nueva      Registrar compra (admin)
/admin/compras            Historial · /admin/compras/[id] detalle (admin)
/admin/inventario         Catálogo · /admin/inventario/[id] editar (admin)
/admin/ajustes            Tasa de respaldo (admin)
```

### Compras, costo y margen

Cada producto lleva dos precios: **`cost_usd`** (lo que pagaste) y **`price`** (a lo
que vendes). El costo lo fija cada compra registrada — base **último costo**, el de la
compra más reciente, que con inflación de por medio es lo que refleja cuánto te
costaría reponerlo hoy.

`register_purchase()` suma existencias, fija el costo y —si lo indicas— el precio de
venta, todo en una transacción. Es la operación inversa a una venta y sigue la misma
regla: no puede existir una compra sin su entrada de stock.

Al registrar una compra puedes **crear productos nuevos en la misma pantalla**: se dan
de alta con stock 0 y la compra les suma la cantidad. Si la compra falla después, esos
productos se borran automáticamente para no dejar basura en el catálogo.

**El costo también se congela en cada línea de venta** (`sale_items.unit_cost_usd`).
Sin eso, comprar más caro el mes que viene haría parecer que las ventas de este mes
ganaron menos de lo que ganaron. El margen se calcula sobre el **precio de venta**
(convención comercial), y cuando alguna venta no tiene costo registrado el panel dice
que la ganancia está incompleta en vez de presentarla como exacta.

### Fotos de producto (Supabase Storage)

Las fotos se **suben**, no se pegan por URL. Van al bucket público `productos`:
lectura para cualquiera (salen en la web), y subir/reemplazar/borrar solo para el
admin. El límite de 3 MB y los tipos permitidos los aplica el propio Storage, no el
formulario — la validación del navegador se puede saltar, la del bucket no.

`products.image` guarda la **ruta dentro del bucket**, y `imageSrc()` resuelve tanto
esas rutas como las locales antiguas (`/products/x.png`), así que los productos
originales siguen funcionando sin resubir nada.

Cada archivo lleva un sufijo aleatorio a propósito: reusar el nombre dejaría la foto
vieja cacheada en los CDN y el catálogo mostraría la anterior durante horas. Como el
nombre es único, la foto es inmutable y se cachea un año.

### Ventas y monedas

Los precios se guardan **solo en USD**. Los bolívares se calculan al mostrar, nunca se
almacenan como un segundo precio: dos cifras guardadas se contradicen en cuanto la
tasa se mueve.

La tasa se toma del **BCV** (`ve.dolarapi.com`) con caché de una hora. Si la API no
responde —son servicios no oficiales y se caen— se usa el respaldo manual de Ajustes.
Sin ninguna de las dos no se puede facturar, y el panel lo dice en vez de inventarse
un número.

Cada venta **congela** la tasa y el precio unitario del momento, así que subir un
precio hoy no reescribe lo que facturaste el mes pasado.

Registrar una venta pasa por `register_sale()`, que descuenta el stock en la **misma
transacción**. Es todo o nada: si un renglón se queda corto, no se guarda nada. El
descuento lleva la condición `stock >= qty` dentro del `UPDATE`, así que dos cajas
vendiendo la última unidad a la vez no pueden dejar el stock en negativo.

## Diseño

Dos sistemas visuales que comparten paleta y nada más:

- **Landing** — `app/globals.css` (+ copia portable en `tokens.css`). Lenguaje de
  cartel: slab enorme, sombra dura desplazada, radio cero, antetítulos en script.
- **Panel** — `app/admin/crm.css`. Lenguaje de herramienta: líneas de 1px, radios
  suaves, titulares en la sans del cuerpo, densidad alta. Lo de la landing convence en
  diez segundos y cansa en una jornada de ocho horas.

Restricciones que rompen la página en silencio si se olvidan, documentadas en la
cabecera de `globals.css`: **el rojo `--signal` nunca lleva texto oscuro encima**
(mide 2.98 — sobre fondo oscuro va `--signal-lift`), y el display **Bevan solo existe
en peso 400**.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
