# Web Taller de Coches — Agenda de citas

Web muy sencilla en **Node.js + Express + SQLite** para que un taller mecánico
reciba solicitudes de cita de sus clientes y las gestione desde un panel.

## Funcionalidad

- **`/`** — Formulario público de solicitud de cita (nombre, teléfono, email,
  vehículo, servicio, fecha/hora preferida y comentarios).
- **`/admin`** — Panel protegido con Basic Auth para ver todas las citas,
  cambiar su estado (`pendiente`, `confirmada`, `completada`, `cancelada`) y
  eliminarlas.
- **`/health`** — Endpoint de salud para los health checks de Dokploy.

Los datos se guardan en un único fichero SQLite (`better-sqlite3`).

## Desarrollo local

```bash
npm install
cp .env.example .env      # ajusta ADMIN_PASSWORD, TALLER_NOMBRE, etc.
npm run dev               # http://localhost:3000
```

## Variables de entorno

| Variable         | Por defecto            | Descripción                                  |
|------------------|------------------------|----------------------------------------------|
| `PORT`           | `3000`                 | Puerto HTTP                                   |
| `TALLER_NOMBRE`  | `Taller Mecánico`      | Nombre que se muestra en la cabecera         |
| `DB_PATH`        | `./data/taller.db`     | Ruta del fichero SQLite                       |
| `ADMIN_USER`     | `admin`                | Usuario del panel                            |
| `ADMIN_PASSWORD` | `cambia-esta-clave`    | **Cámbiala siempre en producción**           |

## Despliegue en Dokploy

1. **Crear la aplicación**
   - En Dokploy: *Create Application* → tipo **Dockerfile**.
   - Conecta este repositorio (o sube el código) y deja el *Build Path* en `/`.
     Dokploy detectará el `Dockerfile` de la raíz.

2. **Variables de entorno** (pestaña *Environment*)
   ```
   TALLER_NOMBRE=Taller Mecánico Pepe
   ADMIN_USER=admin
   ADMIN_PASSWORD=una-clave-larga-y-secreta
   DB_PATH=/data/taller.db
   ```
   > `PORT` puede dejarse en 3000; es el puerto que expone el contenedor.

3. **Volumen persistente** (pestaña *Volumes* / *Mounts*) — imprescindible para
   no perder las citas en cada redeploy:
   - Tipo: **Volume Mount**
   - *Volume Name*: `taller-data`
   - *Mount Path*: `/data`

4. **Dominio y puerto** (pestaña *Domains*)
   - Añade tu dominio y apunta el *Container Port* a **3000**.
   - Activa HTTPS (Let's Encrypt).

5. **Health check** (opcional, pestaña *Advanced*)
   - Path: `/health`

6. **Deploy.** Cada `git push` a la rama configurada (o pulsar *Deploy*)
   reconstruye la imagen y publica la nueva versión conservando el volumen.

### Notas

- `better-sqlite3` incluye binarios precompilados para Linux x64/arm64, así que
  la imagen construye sin herramientas de compilación.
- SQLite usa modo WAL; el volumen en `/data` guarda `taller.db`, `taller.db-wal`
  y `taller.db-shm`.
- Copia de seguridad: basta con descargar el fichero `/data/taller.db` del
  volumen.
