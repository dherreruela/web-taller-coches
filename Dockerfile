# Imagen para desplegar en Dokploy
FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Instalar dependencias primero (mejor cacheo de capas).
# better-sqlite3 trae binarios precompilados para linux x64/arm64,
# por lo que normalmente no necesita herramientas de compilación.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# La base de datos vive en /data para poder montar un volumen persistente.
ENV DB_PATH=/data/taller.db
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000
# En Dokploy las variables se inyectan desde el panel; si además hubiera un
# .env en la imagen, --env-file-if-exists lo cargaria sin fallar si no existe.
CMD ["node", "--env-file-if-exists=.env", "src/server.js"]
