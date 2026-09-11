# SINNER Supabase: fases 1, 2 y 3

Este paquete instala la base de datos de desarrollo desde las migraciones que ya
son la fuente de verdad del repositorio. El archivo combinado es generado; no se
mantiene una segunda definicion manual del esquema.

## Orden exacto

1. Confirma que estas trabajando en el proyecto Supabase de desarrollo.
2. Abre **SQL Editor** y crea una consulta nueva.
3. Abre `SINNER_PHASES_1_2_SQL_EDITOR.sql`, copia su contenido completo y pegalo.
4. Ejecuta **Run** una sola vez. Debe terminar con el mensaje
   `SINNER Phases 1 and 2 verified successfully.`
5. En el proyecto local, cambia `SINNER_USE_DEVELOPMENT_FIXTURES=false` en
   `.env.local` y reinicia `npm run dev`.
6. Abre `/spaces` y confirma que aparecen 10 espacios provenientes de Supabase.

## Actualizacion nacional de Mexico

Si las fases 1 y 2 ya estaban instaladas antes de incorporar ubicaciones
nacionales, ejecuta en SQL Editor solamente
`SINNER_MEXICO_NATIONWIDE_UPGRADE.sql`. No vuelvas a ejecutar el bootstrap
completo. El upgrade agrega el modelo de ubicacion, reemplaza el RPC de busqueda,
redistribuye el seed y ejecuta las verificaciones dentro de una sola transaccion.

El script usa una sola transaccion. Si una sentencia o verificacion falla, no se
confirma ninguna parte de la instalacion. No vuelvas a ejecutarlo si ya termino
correctamente: las migraciones base crean tipos y tablas deliberadamente una vez.

## Usuarios demo

Los tres usuarios usan la contrasena de desarrollo `SinnerDemo2026!`:

- `host.nocturne@sinner.local`
- `guest.one@sinner.local`
- `guest.two@sinner.local`

No uses estas cuentas ni este seed en produccion.

## Fase 3: Booking Engine

Si fases 1 y 2 ya estan instaladas, ejecuta estos archivos en este orden:

1. `SINNER_PHASE_3_STEP_1_ENUMS.sql`
2. `SINNER_PHASE_3_BOOKING_ENGINE.sql`
3. `verify_phase_3.sql`

El primer archivo agrega el status `expired` al enum existente. Es intencional
ejecutarlo separado para que PostgreSQL pueda usar ese valor en funciones,
constraints y seed posteriores sin errores transaccionales.

Tambien existe `SINNER_PHASE_3_ONE_SQL.sql` para pegar Fase 3 completa de una
sola vez. Ese archivo incluye un `commit;` intencional despues del enum
`expired`; no lo quites.

Si un intento de Fase 3 fallo a la mitad, ejecuta:

1. `SINNER_PHASE_3_STEP_1_ENUMS.sql`
2. `SINNER_PHASE_3_REPAIR_AND_VERIFY.sql`

Ese segundo archivo vuelve a aplicar el motor de reservas y despues verifica que
`booking_events`, RPCs, constraints, grants y privacidad hayan quedado bien.

Despues de esos pasos, el seed demo de Fase 3 es opcional. Para cargar
requests pendientes, holds activos, holds expirados y cancelaciones de prueba,
ejecuta `SINNER_PHASE_3_DEMO_SEED.sql` desde esta carpeta. No lo ejecutes en datos reales de
produccion.

Resultado esperado:

- `spaces.timezone` existe y cada espacio usa una timezone IANA.
- `bookings` tiene `booking_reference`, `booking_type`, snapshots de precio,
  `hold_expires_at`, `idempotency_key` y buffer snapshot.
- `booking_events` existe y los usuarios no pueden modificarlo directamente.
- Los RPCs `create_booking_request`, `approve_booking_request`,
  `decline_booking_request`, `cancel_booking_before_payment` y
  `expire_booking_holds` existen.
- La constraint `bookings_no_active_overlap` bloquea solapes de
  `payment_pending` y `confirmed`.

## Regenerar el archivo combinado

Cada cambio futuro debe hacerse primero en `supabase/migrations/` o
`supabase/seed.sql`. Despues ejecuta:

```powershell
node supabase/sql-editor/build-bundle.mjs
```
