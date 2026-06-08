# 🪵 Pablo's Carpintería — Sitio Web Full-Stack

**🌐 URL pública:** https://carpinteria-pablo.web.app
---

## 📸 Capturas

| Inicio (Desktop) | Catálogo | Panel Admin |
|------------------|----------|-------------|
| Diseño Maderaviva con hero y colecciones | Filtros por categoría + galería | CRUD completo de productos |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                  │
│              Angular 21 + TypeScript                 │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Firebase   │ │   Firebase   │ │  Cloudinary  │
│ Hosting(CDN) │ │  Auth +      │ │  (Imágenes)  │
│              │ │  Firestore   │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Arquitectura:** JAMstack · Serverless · Multi-cloud  
**Sin servidor propio:** escala automáticamente de 0 a millones de usuarios

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
|------|------------|-------------|
| **Frontend** | Angular 21 + TypeScript | Framework empresarial de Google |
| **Estilos** | CSS3 Variables + Responsive | Diseño mobile-first |
| **Tipografía** | Google Fonts (Fraunces + Inter) | Fuentes profesionales |
| **Autenticación** | Firebase Auth + Google OAuth 2.0 | Login seguro con cuenta de Google |
| **Base de datos** | Cloud Firestore (NoSQL) | Sincronización en tiempo real |
| **Imágenes** | Cloudinary CDN | Subida y optimización automática |
| **Hosting** | Firebase Hosting + CDN global | HTTPS automático, 99.9% uptime |
| **Containerización** | Docker + docker-compose | Portabilidad entre entornos |
| **Versionado** | Git + GitHub | Control de versiones profesional |
| **Integraciones** | WhatsApp Business API | Notificaciones automáticas |

**Empresas que usan este mismo stack:**  
Google · The Economist · Alibaba · Trivago · Venmo · Forbes

---

## ✨ Funcionalidades

### Para clientes
- 🛋️ Catálogo de muebles con filtros por categoría (Cocina, Sala, Recámara, Oficina)
- 🖼️ Galería de fotos por producto con vista de detalle
- ❤️ Sistema de favoritos sincronizado en la nube (persiste entre dispositivos)
- ⭐ Reseñas y calificaciones en tiempo real
- 📅 Agenda de visitas con envío automático a WhatsApp
- 🔐 Login con cuenta de Google (OAuth 2.0)
- 📱 Diseño responsivo (desktop + móvil)

### Para el administrador
- ➕ Agregar nuevos muebles al catálogo
- ✏️ Editar productos existentes (nombre, descripción, fotos, etc.)
- 🗑️ Eliminar productos con confirmación
- 📸 Subir fotos reales desde PC o celular (Cloudinary)
- 📋 Ver todas las solicitudes de cita en tiempo real
- ✅ Confirmar o cancelar citas de clientes

---

## 🚀 Cómo correr el proyecto

### Opción A — Con Docker (recomendado, sin instalar nada)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Ghost-GAM/mi-proyecto.git
cd mi-proyecto

# 2. Correr con Docker
docker-compose up --build

# 3. Abrir en el navegador
# http://localhost:8080
```

> **Requisito:** tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

### Opción B — Desarrollo local (con Node.js)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Ghost-GAM/mi-proyecto.git
cd mi-proyecto/frontend

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Crear archivo de credenciales Firebase
# Copiar firebase.config.ts.example a firebase.config.ts y llenar los valores

# 4. Correr en modo desarrollo
ng serve

# 5. Abrir en el navegador
# http://localhost:4200
```

### Opción C — Sitio en producción (sin instalar nada)

Simplemente visitar: **[https://carpinteria-pablo.web.app](https://carpinteria-pablo.web.app)**

---

## 📁 Estructura del proyecto

```
mi-proyecto/
├── frontend/                          # Aplicación Angular
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       │   └── carpinteria/
│   │       │       └── carpinteria.ts # Componente principal (SPA)
│   │       ├── app.config.ts          # Configuración Angular + Firebase
│   │       └── app.routes.ts          # Rutas
│   ├── firebase.json                  # Configuración Firebase Hosting
│   └── package.json
├── backend/                           # NestJS (preparado para expansión)
├── Dockerfile                         # Imagen Docker multi-stage
├── docker-compose.yml                 # Orquestación de contenedores
├── nginx.conf                         # Servidor web para producción
└── README.md
```

---

## 🔒 Seguridad

La seguridad se implementa mediante **Firestore Security Rules** ejecutadas en Google Cloud:

```javascript
// Solo el admin puede modificar productos
allow write: if request.auth.token.email == 'admin@ejemplo.com';

// Solo el dueño ve sus favoritos
allow read: if resource.data.userId == request.auth.uid;

// Cualquiera puede leer el catálogo
allow read: if true;
```

Estas reglas son **imposibles de saltarse** desde el cliente porque se ejecutan en los servidores de Google antes de tocar la base de datos.

---

## 🌐 Despliegue (Deploy)

El sitio se despliega manualmente a Firebase Hosting:

```bash
cd frontend
ng build --configuration production
firebase deploy --only hosting
```

**URL resultante:** `https://carpinteria-pablo.web.app`