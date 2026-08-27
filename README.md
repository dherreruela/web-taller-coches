# Web Taller de Coches — Agenda de citas

Web muy sencilla en **Node.js + Express + SQLite** para que un taller mecánico
reciba solicitudes de cita de sus clientes y las gestione desde un panel.

## Funcionalidad

- **`/`** — Formulario público de solicitud de cita (nombre, teléfono, email,
  vehículo, servicio, fecha/hora preferida y comentarios).
- **`/admin`** — Panel protegido (formulario de login con cookie, o Basic Auth
  para llamadas por API) para ver todas las citas, cambiar su estado
  (`pendiente`, `confirmada`, `completada`, `cancelada`) y eliminarlas.
- **`/health`** — Endpoint de salud (`{ "ok": true }`).

Los datos se guardan en un único fichero SQLite (`better-sqlite3`).

## Desarrollo local

```bash
npm install
cp .env.example .env      # ajusta ADMIN_PASSWORD, TALLER_NOMBRE, etc.
npm run dev               # http://localhost:3000
```

## Variables de entorno

| Variable         | Por defecto            | Descripción                                           |
|------------------|------------------------|------------------------------------------------------|
| `PORT`           | `3000`                 | Puerto HTTP                                           |
| `TALLER_NOMBRE`  | `Taller Mecánico`      | Nombre que se muestra en la cabecera                  |
| `DB_PATH`        | `./data/taller.db`     | Ruta del fichero SQLite                               |
| `ADMIN_USER`     | `admin`                | Usuario del panel                                     |
| `ADMIN_PASSWORD` | `cambia-esta-clave`    | **Cámbiala siempre en producción**                   |
| `SESSION_SECRET` | (usa `ADMIN_PASSWORD`) | Secreto para firmar la cookie de sesión              |
| `LOGIN_HINT`     | `false`                | Si es `true`, muestra usuario/contraseña en el login |

## Puesta en producción (sin Docker)

1. Clona el repositorio en el servidor e instala dependencias:
   ```bash
   git clone <repo> && cd web-taller-coches
   npm install --omit=dev
   ```
2. Crea un `.env` (o exporta las variables) con al menos `ADMIN_PASSWORD` y
   `DB_PATH` apuntando a una ruta persistente, p. ej. `DB_PATH=/var/lib/taller/taller.db`.
3. Arranca con un gestor de procesos para que se reinicie solo:
   ```bash
   npm start                      # arranque simple
   # o con pm2:
   pm2 start "npm start" --name taller
   ```
4. Pon un proxy inverso (Nginx / Caddy) delante para el dominio y el HTTPS,
   redirigiendo al puerto `3000`.

### Notas

- SQLite usa modo WAL; junto a `taller.db` se crean `taller.db-wal` y
  `taller.db-shm` en el mismo directorio.
- Copia de seguridad: basta con copiar el fichero de `DB_PATH` (mejor con el
  servicio parado o usando `sqlite3 .backup`).
- `better-sqlite3` incluye binarios precompilados para Linux x64/arm64, así que
  `npm install` no necesita herramientas de compilación.
