# SINNER Supabase: fases 1 y 2

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

## Regenerar el archivo combinado

Cada cambio futuro debe hacerse primero en `supabase/migrations/` o
`supabase/seed.sql`. Despues ejecuta:

```powershell
node supabase/sql-editor/build-bundle.mjs
```
