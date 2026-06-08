# ===== ETAPA 1: Build =====
# Usamos Node 20 Alpine (imagen ligera) para compilar Angular
FROM node:20-alpine AS build

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json primero (aprovecha cache de Docker)
COPY frontend/package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar el resto del código fuente
COPY frontend/ .

# Compilar Angular en modo producción
RUN npm run build -- --configuration production

# ===== ETAPA 2: Servidor =====
# Usamos Nginx para servir los archivos estáticos compilados
FROM nginx:alpine

# Copiar los archivos compilados de la etapa anterior
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copiar configuración de Nginx para SPA (Angular Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]