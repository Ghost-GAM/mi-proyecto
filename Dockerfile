# ===== ETAPA 1: Build =====
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ .

# Si no existe firebase.config.ts, usar el de ejemplo
RUN if [ ! -f src/app/firebase.config.ts ]; then \
      cp src/app/firebase.config.ts.example src/app/firebase.config.ts; \
    fi

RUN npm run build -- --configuration production

# ===== ETAPA 2: Servidor =====
FROM nginx:alpine

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]