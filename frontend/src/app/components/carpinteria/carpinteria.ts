import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Auth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from '@angular/fire/auth';
import { Firestore, collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { inject } from '@angular/core';

@Component({
  selector: 'app-carpinteria',
  standalone: true,
  template: `<div id="app-root"></div>`,
  styles: [`:host { display: block; }`]
})
export class CarpinteriaComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private el = inject(ElementRef);
  private unsubscribe: any;
  private unsubscribeProds: any;
  private unsubscribeReviews: any;
  private provider = new GoogleAuthProvider();

  // CAMBIA ESTO por el correo de Pablo cuando lo tenga (por ahora usa el tuyo para probar)
  private readonly ADMIN_EMAIL = 'llll_arellano@outlook.com';

  ngOnInit() {
    // Exponer Firestore y operaciones a window ANTES de renderApp
    const db = this.db;
    (window as any).fs = {
      // Productos
      listProductos: () => getDocs(collection(db, 'productos')),
      addProducto: (data: any) => addDoc(collection(db, 'productos'), data),
      updateProducto: (id: string, data: any) => updateDoc(doc(db, 'productos', id), data),
      deleteProducto: (id: string) => deleteDoc(doc(db, 'productos', id)),
      onProductosChange: (cb: any) => onSnapshot(collection(db, 'productos'), cb),
      // Reseñas
      addResena: (data: any) => addDoc(collection(db, 'resenas'), data),
      updateResena: (id: string, data: any) => updateDoc(doc(db, 'resenas', id), data),
      onResenasChange: (productoId: string, cb: any) => onSnapshot(query(collection(db, 'resenas'), where('productoId', '==', productoId)), cb),
      // Citas
      addCita: (data: any) => addDoc(collection(db, 'citas'), data),
      updateCita: (id: string, data: any) => updateDoc(doc(db, 'citas', id), data),
      deleteCita: (id: string) => deleteDoc(doc(db, 'citas', id)),
      onCitasChange: (cb: any) => onSnapshot(collection(db, 'citas'), cb),
      onMisCitasChange: (userId: string, cb: any) => onSnapshot(query(collection(db, 'citas'), where('userId', '==', userId)), cb),
      // Favoritos
      addFavorito: (data: any) => addDoc(collection(db, 'favoritos'), data),
      deleteFavorito: (id: string) => deleteDoc(doc(db, 'favoritos', id)),
      onFavoritosChange: (userId: string, cb: any) => onSnapshot(query(collection(db, 'favoritos'), where('userId', '==', userId)), cb),
      // Server timestamp
      now: () => serverTimestamp(),
    };

    this.renderApp();

    (window as any).loginWithGoogle = async () => {
      try {
        await signInWithPopup(this.auth, this.provider);
        this.closeAuthModal();
      } catch (e) { console.error(e); }
    };

    (window as any).logout = async () => {
      await signOut(this.auth);
    };

    (window as any).authAction = () => {
      if ((window as any).currentUser) {
        (window as any).confirmLogout();
      } else {
        const m = document.getElementById('auth-modal');
        if (m) m.classList.add('open');
      }
    };

    (window as any).confirmLogout = () => {
      const m = document.getElementById('logout-modal');
      if (m) m.classList.add('open');
    };

    (window as any).cancelLogout = () => {
      const m = document.getElementById('logout-modal');
      if (m) m.classList.remove('open');
    };

    (window as any).doLogout = async () => {
      const m = document.getElementById('logout-modal');
      if (m) m.classList.remove('open');
      await signOut(this.auth);
    };

    this.unsubscribe = onAuthStateChanged(this.auth, (user) => {
      const zone = document.getElementById('tb-auth-zone');
      const adminLinks = document.querySelectorAll('.admin-link');
      if (user) {
        const name = user.displayName || user.email || 'Usuario';
        const inicial = name[0].toUpperCase();
        const primerNombre = name.split(' ')[0];
        if (zone) {
          zone.innerHTML =
            '<span class="tb-av">' + inicial + '</span>' +
            '<span class="tb-utxt">' +
              '<span class="tb-uname">' + primerNombre + '</span>' +
              '<span class="tb-salir" onclick="confirmLogout()">Salir</span>' +
            '</span>';
        }
        (window as any).currentUser = name;
        (window as any).currentUserId = user.uid;
        (window as any).isAdmin = user.email === this.ADMIN_EMAIL;
        adminLinks.forEach(a => (a as HTMLElement).style.display = (window as any).isAdmin ? '' : 'none');
        if ((window as any).subscribeFavorites) (window as any).subscribeFavorites();
      } else {
        if (zone) {
          zone.innerHTML = '<button class="tb-login-btn" onclick="authAction()">Iniciar sesión</button>';
        }
        (window as any).currentUser = null;
        (window as any).currentUserId = null;
        (window as any).isAdmin = false;
        adminLinks.forEach(a => (a as HTMLElement).style.display = 'none');
        // Limpiar favoritos y citas
        if ((window as any).subscribeFavorites) (window as any).subscribeFavorites();
        const mc = document.getElementById('mis-citas'); if (mc) mc.innerHTML = '';
      }
      if ((window as any).onAuthChange) (window as any).onAuthChange();
    });
  }

  closeAuthModal() {
    const m = document.getElementById('auth-modal');
    if (m) m.classList.remove('open');
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  renderApp() {
    document.body.innerHTML = this.getHTML();
    try {
      const fn = new Function(this.getJS());
      fn();
    } catch (e) {
      console.error('Error al iniciar la app:', e);
    }
  }

  getHTML(): string {
    return `
<style>${this.getCSS()}</style>

<header class="topbar">
  <div class="tb-inner">
    <div class="tb-logo" onclick="showPage('home')">
      <div class="tb-logo-icon">
        <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#2A1F14"/><path d="M9 23.5 L9 18.5 Q9 17.5 10 17.5 L28 17.5 Q31 17.5 31 20.5 L31 23.5 Q31 24.5 30 24.5 L10 24.5 Q9 24.5 9 23.5 Z" fill="#D4A853"/><path d="M19 17.5 L24 17.5 L21.5 12.5 Q21 11.5 20 12 Q19 12.8 19 14 Z" fill="#C8732E"/><line x1="11" y1="27.5" x2="29" y2="27.5" stroke="#8B5E3C" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/><line x1="13" y1="30" x2="27" y2="30" stroke="#8B5E3C" stroke-width="1.2" stroke-linecap="round" opacity="0.45"/></svg>
      </div>
      <div class="tb-brand-wrap">
        <div class="tb-brand">Pablo's Carpintería</div>
        <div class="tb-sub">Durango · MX</div>
      </div>
    </div>
    <nav class="tb-nav">
      <a class="tb-link active" id="nav-home" onclick="showPage('home')">Inicio</a>
      <a class="tb-link" id="nav-catalog" onclick="showPage('catalog')">Catálogo</a>
      <a class="tb-link" id="nav-saved" onclick="showPage('saved')">Guardados</a>
      <a class="tb-link" id="nav-agenda" onclick="showPage('agenda')">Agenda</a>
      <a class="tb-link admin-link" id="nav-admin" onclick="showPage('admin')" style="display:none">Admin</a>
      <button class="tb-cta" onclick="irAgenda('')">Solicitar pieza</button>
    </nav>
    <div class="tb-right">
      <div class="tb-auth" id="tb-auth-zone">
        <button class="tb-login-btn" id="tb-login-btn" onclick="authAction()">Iniciar sesión</button>
      </div>
    </div>
  </div>
</header>

<nav class="bottom-nav">
  <button class="bn-item active" id="bn-home" onclick="showPage('home')"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg><span>Inicio</span></button>
  <button class="bn-item" id="bn-catalog" onclick="showPage('catalog')"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg><span>Catálogo</span></button>
  <button class="bn-item" id="bn-saved" onclick="showPage('saved')"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg><span>Guardados</span></button>
  <button class="bn-item" id="bn-agenda" onclick="showPage('agenda')"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg><span>Agenda</span></button>
  <button class="bn-item" id="bn-acc" onclick="authAction()"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span id="bn-acc-label">Entrar</span></button>
  <button class="bn-item admin-link" id="bn-admin" onclick="showPage('admin')" style="display:none"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg><span>Admin</span></button>
</nav>

<div class="modal-overlay" id="auth-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeAuth()">\u2715</button>
    <div class="modal-icon"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#2A1F14"/><path d="M9 23.5 L9 18.5 Q9 17.5 10 17.5 L28 17.5 Q31 17.5 31 20.5 L31 23.5 Q31 24.5 30 24.5 L10 24.5 Q9 24.5 9 23.5 Z" fill="#D4A853"/><path d="M19 17.5 L24 17.5 L21.5 12.5 Q21 11.5 20 12 Q19 12.8 19 14 Z" fill="#C8732E"/><line x1="11" y1="27.5" x2="29" y2="27.5" stroke="#8B5E3C" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/><line x1="13" y1="30" x2="27" y2="30" stroke="#8B5E3C" stroke-width="1.2" stroke-linecap="round" opacity="0.45"/></svg></div>
    <h2>Pablo's Carpintería</h2>
    <p>Inicia sesión para guardar diseños y agendar tu visita</p>
    <button class="g-btn" onclick="loginWithGoogle()">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continuar con Google
    </button>
  </div>
</div>

<div class="modal-overlay" id="logout-modal">
  <div class="modal">
    <button class="modal-close" onclick="cancelLogout()">✕</button>
    <div class="logout-icon">👋</div>
    <h2>¿Cerrar sesión?</h2>
    <p>Tendrás que iniciar sesión otra vez para agendar visitas o guardar diseños.</p>
    <div class="logout-actions">
      <button class="lo-cancel" onclick="cancelLogout()">Cancelar</button>
      <button class="lo-confirm" onclick="doLogout()">Sí, salir</button>
    </div>
  </div>
</div>

<main class="wrap">

  <!-- ===== HOME ===== -->
  <section class="page active" id="page-home">
    <div class="hero">
      <div class="hero-text">
        <div class="eyebrow"><span class="eyebrow-line"></span>Diseño · Calidad · Durango</div>
        <h1 class="display-1 hero-title">Diseñamos muebles<br> a tu medida, con<br> <em>calidad</em> que perdura.</h1>
        <p class="lede">En Pablo's Carpintería tallamos cada pieza pensando en quien la va a usar. Cocinas, salas, recámaras y oficinas con materiales de primera.</p>
        <div class="hero-cta">
          <button class="btn-primary" onclick="showPage('catalog')">Ver catálogo \u2192</button>
          <button class="btn-link" onclick="irAgenda('')">Solicitar visita</button>
        </div>
        <dl class="stats">
          <div><dt>7+</dt><dd>Proyectos</dd></div>
          <div><dt>100%</dt><dd>A medida</dd></div>
          <div><dt>MX</dt><dd>Durango</dd></div>
        </dl>
      </div>
      <div class="hero-img"><img src="https://i.imgur.com/6TCGqVu.jpeg" alt="Trabajo destacado"/></div>
    </div>

    <div class="band">
      <div class="band-head">
        <div>
          <div class="section-eyebrow">01 — Colecciones</div>
          <h2 class="display-2">Cuatro espacios, una misma mano.</h2>
        </div>
        <button class="btn-link" onclick="showPage('catalog')">Ver todo \u2192</button>
      </div>
      <div class="grid3" id="home-cats"></div>
    </div>

    <div class="band band-alt">
      <div class="band-head">
        <div>
          <div class="section-eyebrow">02 — Selección</div>
          <h2 class="display-2">Piezas que hablan por sí solas.</h2>
        </div>
      </div>
      <div class="grid3" id="home-featured"></div>
    </div>
  </section>

  <!-- ===== CATALOG ===== -->
  <section class="page" id="page-catalog">
    <div class="page-intro">
      <div class="section-eyebrow">Catálogo</div>
      <h1 class="display-1">Toda la colección.</h1>
      <p class="lede" id="catalog-count">Cada pieza se elabora bajo pedido.</p>
    </div>
    <div class="filters" id="filters"></div>
    <div class="grid3" id="catalog-grid"></div>
  </section>

  <!-- ===== DETAIL ===== -->
  <section class="page" id="page-detail">
    <button class="back-btn" onclick="goBack()">\u2190 Regresar</button>
    <div class="detail">
      <div class="detail-gallery">
        <img id="d-img" src="" alt=""/>
        <div class="detail-thumbs" id="d-thumbs"></div>
      </div>
      <div class="detail-info">
        <div class="section-eyebrow" id="d-cat"></div>
        <h1 class="display-1" id="d-name"></h1>
        <p class="detail-desc" id="d-desc"></p>
        <div class="detail-specs" id="d-specs"></div>
        <div class="detail-actions">
          <button class="btn-primary" onclick="solicitarPieza()">Solicitar esta pieza</button>
          <button class="btn-outline" id="d-save" onclick="toggleSaveDetail()">\u2661 Guardar</button>
        </div>
      </div>
    </div>
    <div class="reviews">
      <h2 class="display-2">Reseñas</h2>
      <div class="reviews-grid">
        <div id="reviews-list"></div>
        <div class="review-form" id="review-form"></div>
      </div>
    </div>
  </section>

  <!-- ===== SAVED ===== -->
  <section class="page" id="page-saved">
    <div class="page-intro">
      <div class="section-eyebrow">Tus favoritos</div>
      <h1 class="display-1">Diseños guardados.</h1>
    </div>
    <div id="saved-content"></div>
  </section>

  <!-- ===== AGENDA ===== -->
  <section class="page" id="page-agenda">
    <div class="agenda-layout">
      <div class="agenda-intro">
        <div class="section-eyebrow">Agenda</div>
        <h1 class="display-1">Cuéntanos qué tienes en mente.</h1>
        <p class="lede">Cada pieza se hace por encargo. Selecciona los días y horas en que estarás en casa para que Pablo vaya a tomar las medidas.</p>
        <div class="agenda-note">
          <strong>Atención a domicilio</strong>
          <span>Pablo se traslada a tu hogar sin costo para tomar medidas y darte una cotización.</span>
        </div>
      </div>
      <div class="agenda-card" id="agenda-form-wrap"></div>
    </div>
    <div class="mis-citas-wrap" id="mis-citas"></div>
  </section>

  <!-- ===== ADMIN ===== -->
  <section class="page" id="page-admin">
    <div class="page-intro">
      <div class="section-eyebrow">Administración</div>
      <h1 class="display-1">Panel de control.</h1>
    </div>
    <div class="admin-cards">
      <div class="admin-card" onclick="showPage('admin-prod')">
        <div class="admin-card-ico">▦</div>
        <div class="admin-card-title">Gestionar productos</div>
        <div class="admin-card-desc">Ver y editar el catálogo de muebles</div>
      </div>
      <div class="admin-card" onclick="showPage('admin-agenda')">
        <div class="admin-card-ico">▣</div>
        <div class="admin-card-title">Agenda de citas</div>
        <div class="admin-card-desc">Citas y solicitudes de clientes</div>
      </div>
    </div>
  </section>

  <section class="page" id="page-admin-prod">
    <button class="back-btn" onclick="showPage('admin')">\u2190 Regresar</button>
    <div class="page-intro"><h1 class="display-2">Gestionar productos</h1>
    <p class="lede">Agrega, edita o elimina muebles del catálogo. Los cambios se ven al instante en todos los dispositivos.</p></div>
    <div id="admin-prod-list"></div>
  </section>

  <section class="page" id="page-admin-agenda">
    <button class="back-btn" onclick="showPage('admin')">\u2190 Regresar</button>
    <div class="page-intro"><h1 class="display-2">Solicitudes y citas</h1></div>
    <div id="admin-agenda-content"></div>
  </section>

</main>`;
  }

  getCSS(): string {
    return `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --cream:#F5EFE0;--cream2:#EFE7D6;--dark:#2A1F14;--wood:#8B5E3C;
  --accent:#C8732E;--accent-soft:#D4A853;--text:#3D2B1A;--muted:#9C7B5E;
  --white:#FFFDF7;--line:rgba(42,31,20,.12);
  --pad:clamp(36px,7vw,108px);--bottom-h:62px;
}
body{font-family:'Inter',sans-serif;background:var(--cream);color:var(--text);overflow-x:hidden;-webkit-text-size-adjust:100%}

.topbar{position:sticky;top:0;z-index:200;background:rgba(245,239,224,.95);backdrop-filter:blur(8px);border-bottom:.5px solid var(--line)}
.tb-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px var(--pad);max-width:1400px;margin:0 auto}
.tb-logo{display:flex;align-items:center;gap:11px;cursor:pointer;flex-shrink:0}
.tb-logo-icon{width:36px;height:36px;border-radius:50%;background:var(--white);border:1px solid var(--wood);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tb-logo-icon svg{width:20px;height:20px}
.tb-brand{font-family:'Fraunces',serif;font-size:17px;font-weight:600;line-height:1;letter-spacing:-.2px}
.tb-sub{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--muted);margin-top:3px}
.tb-nav{display:flex;align-items:center;gap:30px}
.tb-link{font-size:15px;color:rgba(42,31,20,.6);text-decoration:none;cursor:pointer;transition:color .2s;white-space:nowrap}
.tb-link:hover{color:var(--dark)}
.tb-link.active{color:var(--dark);font-weight:500}
.tb-right{display:flex;align-items:center;flex-shrink:0;justify-content:flex-end;min-width:150px}
.tb-cta{background:var(--dark);color:#fff;border:none;font-size:11px;padding:10px 18px;border-radius:999px;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;font-family:'Inter',sans-serif;transition:background .2s;white-space:nowrap}
.tb-cta:hover{background:var(--accent)}
.tb-auth{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.tb-login-btn{background:transparent;border:none;color:rgba(42,31,20,.7);font-family:'Inter',sans-serif;font-size:14px;cursor:pointer;padding:6px 2px;white-space:nowrap}
.tb-login-btn:hover{color:var(--dark)}
.tb-av{width:36px;height:36px;border-radius:50%;background:var(--wood);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;flex-shrink:0}
.tb-utxt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.3}
.tb-uname{font-weight:600;color:var(--dark);font-size:14px;white-space:nowrap}
.tb-salir{font-size:11px;color:var(--muted);cursor:pointer;display:inline-block}
.tb-salir:hover{color:var(--accent);text-decoration:underline}

.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:var(--bottom-h);background:var(--dark);z-index:200;align-items:center;justify-content:space-around;padding:0 6px}
.bn-item{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:7px 10px;border-radius:10px;border:none;background:transparent;color:var(--muted);transition:color .2s;font-family:'Inter',sans-serif}
.bn-item.active,.bn-item:hover{color:var(--accent-soft)}
.bn-item svg{width:21px;height:21px}
.bn-item span{font-size:9px;font-weight:500}

.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;align-items:center;justify-content:center;padding:16px}
.modal-overlay.open{display:flex}
.modal{background:var(--white);border-radius:18px;padding:34px 28px;width:100%;max-width:340px;text-align:center;position:relative}
.modal-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:18px;cursor:pointer;color:var(--muted)}
.modal-icon{width:48px;height:48px;margin:0 auto 14px}
.modal-icon svg{width:100%;height:100%}
.modal h2{font-family:'Fraunces',serif;font-size:21px;font-weight:600;color:var(--dark);margin-bottom:6px}
.modal p{font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.5}
.g-btn{width:100%;background:var(--dark);color:#fff;border:none;padding:12px;border-radius:10px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .2s}
.g-btn:hover{background:var(--accent)}
.logout-icon{font-size:38px;margin-bottom:14px;line-height:1}
.logout-actions{display:flex;gap:10px;margin-top:6px}
.lo-cancel{flex:1;background:var(--cream);color:var(--dark);border:1px solid var(--line);padding:12px;border-radius:10px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer}
.lo-cancel:hover{background:var(--cream2)}
.lo-confirm{flex:1;background:var(--dark);color:#fff;border:none;padding:12px;border-radius:10px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer}
.lo-confirm:hover{background:var(--accent)}

.wrap{max-width:1400px;margin:0 auto}
.page{display:none}
.page.active{display:block;animation:fade .35s ease}
@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.display-1{font-family:'Fraunces',serif;font-size:clamp(38px,5.6vw,62px);font-weight:500;line-height:1;letter-spacing:-1px;color:var(--dark)}
.hero-title{font-size:clamp(36px,5.2vw,62px);line-height:1.08}
.display-1 em{font-style:italic;color:var(--accent);font-weight:500}
.display-2{font-family:'Fraunces',serif;font-size:clamp(29px,4.2vw,46px);font-weight:500;line-height:1.05;letter-spacing:-.5px;color:var(--dark)}
.lede{font-size:17px;color:var(--muted);line-height:1.65;max-width:480px;margin-top:16px}
.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:3px;color:var(--muted);margin-bottom:18px;display:flex;align-items:center;gap:12px}
.eyebrow-line{width:30px;height:1px;background:rgba(42,31,20,.4)}
.section-eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:2.5px;color:var(--muted);margin-bottom:10px}

.hero{display:grid;grid-template-columns:1fr 1.05fr;gap:clamp(30px,5vw,64px);padding:clamp(40px,7vw,84px) var(--pad) clamp(44px,8vw,96px);align-items:center}
.hero-text{padding-top:6px;display:flex;flex-direction:column;justify-content:center}
.hero-cta{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-top:32px}
.btn-primary{background:var(--dark);color:#fff;border:none;padding:14px 28px;border-radius:999px;font-family:'Inter',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:background .2s}
.btn-primary:hover{background:var(--accent)}
.btn-link{background:none;border:none;font-family:'Inter',sans-serif;font-size:15px;font-weight:500;color:var(--dark);text-decoration:underline;text-underline-offset:4px;cursor:pointer}
.btn-link:hover{color:var(--accent)}
.btn-outline{background:transparent;border:1.5px solid var(--line);color:var(--dark);padding:13px 26px;border-radius:999px;font-family:'Inter',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all .2s}
.btn-outline:hover,.btn-outline.saved{border-color:var(--accent);color:var(--accent)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;border-top:.5px solid var(--line);margin-top:44px;padding-top:26px}
.stats dt{font-family:'Fraunces',serif;font-size:32px;font-weight:500;color:var(--dark)}
.stats dd{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-top:5px}
.hero-img{position:relative;overflow:hidden;border-radius:4px;background:var(--dark);aspect-ratio:1/1.15;width:100%}
.hero-img img{width:100%;height:100%;object-fit:cover;display:block}

.band{padding:clamp(44px,7vw,84px) var(--pad);border-top:.5px solid var(--line)}
.band-alt{background:rgba(239,231,214,.5)}
.band-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:32px;flex-wrap:wrap}

.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(18px,2.5vw,34px)}
.coll-card{cursor:pointer;display:block}
.coll-img{aspect-ratio:4/5;position:relative;overflow:hidden;border-radius:4px;background:var(--cream2)}
.coll-img img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
.coll-card:hover .coll-img img{transform:scale(1.05)}
.coll-num{position:absolute;top:12px;left:12px;background:rgba(245,239,224,.92);padding:4px 12px;border-radius:999px;font-size:11px;letter-spacing:2px;color:var(--dark)}
.coll-save{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:rgba(245,239,224,.92);border:none;cursor:pointer;font-size:15px;color:var(--dark);display:flex;align-items:center;justify-content:center;transition:all .2s}
.coll-save.saved{background:var(--accent);color:#fff}
.coll-meta{display:flex;justify-content:space-between;align-items:baseline;margin-top:16px;gap:10px}
.coll-name{font-family:'Fraunces',serif;font-size:22px;font-weight:500;color:var(--dark)}
.coll-cat{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);margin-top:3px}
.coll-explore{font-size:11px;color:var(--muted);white-space:nowrap}
.coll-card:hover .coll-explore{color:var(--accent)}
.coll-desc{font-size:14px;color:var(--muted);margin-top:6px}

.page-intro{padding:clamp(40px,6vw,70px) var(--pad) clamp(22px,3vw,32px)}
.filters{display:flex;gap:10px;flex-wrap:wrap;padding:0 var(--pad) clamp(24px,4vw,36px);border-bottom:.5px solid var(--line);margin-bottom:clamp(30px,4vw,44px)}
.filter-pill{background:transparent;border:1px solid var(--line);color:var(--text);padding:10px 22px;border-radius:999px;font-family:'Inter',sans-serif;font-size:14px;cursor:pointer;transition:all .2s}
.filter-pill:hover{border-color:var(--wood)}
.filter-pill.active{background:var(--dark);color:#fff;border-color:var(--dark)}
#catalog-grid{padding:0 var(--pad) clamp(54px,8vw,96px)}

.back-btn{background:none;border:none;font-family:'Inter',sans-serif;font-size:13px;color:var(--muted);cursor:pointer;margin:26px var(--pad) 0;padding:6px 0}
.back-btn:hover{color:var(--dark)}
.detail{display:grid;grid-template-columns:1fr 1fr;gap:clamp(30px,5vw,64px);padding:clamp(22px,3vw,32px) var(--pad) clamp(34px,5vw,54px);align-items:start}
.detail-gallery{position:relative}
.detail-gallery>img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:4px;background:var(--cream2);display:block;max-height:620px}
.detail-thumbs{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.thumb{width:64px;height:50px;border-radius:4px;overflow:hidden;cursor:pointer;border:2px solid transparent}
.thumb.active,.thumb:hover{border-color:var(--accent)}
.thumb img{width:100%;height:100%;object-fit:cover}
.detail-info{padding-top:10px}
.detail-desc{font-size:16px;color:var(--text);line-height:1.7;margin:20px 0 26px}
.detail-specs{border-top:.5px solid var(--line);margin-bottom:30px}
.spec-row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:.5px solid var(--line);font-size:14px}
.spec-row span:first-child{color:var(--muted)}
.spec-row span:last-child{font-weight:500;color:var(--dark)}
.detail-actions{display:flex;gap:12px;flex-wrap:wrap}
.reviews{padding:clamp(40px,6vw,76px) var(--pad) clamp(54px,8vw,96px);border-top:.5px solid var(--line)}
.reviews-grid{display:grid;grid-template-columns:1fr 380px;gap:clamp(30px,4vw,52px);margin-top:30px;align-items:start}
.review-form{background:var(--white);border-radius:14px;padding:22px;border:.5px solid var(--line)}
.review-form h4{font-family:'Fraunces',serif;font-size:17px;font-weight:500;margin-bottom:14px}
.rf-input{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px 13px;font-family:'Inter',sans-serif;font-size:13px;color:var(--text);background:var(--cream);margin-bottom:10px;outline:none}
.rf-input:focus{border-color:var(--wood)}
textarea.rf-input{resize:none;height:80px}
.rf-stars{display:flex;align-items:center;gap:6px;margin-bottom:14px;font-size:13px;color:var(--muted)}
.rf-star{font-size:24px;cursor:pointer;color:#ddd;line-height:1}
.rf-star.on{color:var(--accent-soft)}
.rf-submit{width:100%;background:var(--dark);color:#fff;border:none;padding:12px;border-radius:999px;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer}
.rf-submit:hover{background:var(--accent)}
.rf-locked{text-align:center;padding:14px;font-size:13px;color:var(--muted);cursor:pointer}
.rf-locked b{color:var(--wood)}
.review-item{background:var(--white);border-radius:12px;padding:16px;margin-bottom:12px;border:.5px solid var(--line)}
.ri-top{display:flex;align-items:center;gap:10px;margin-bottom:7px}
.ri-av{width:34px;height:34px;border-radius:50%;background:var(--wood);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0}
.ri-name{font-weight:600;font-size:14px;color:var(--dark)}
.ri-date{font-size:10px;color:var(--muted)}
.ri-stars{color:var(--accent-soft);font-size:12px;margin-bottom:6px}
.ri-text{font-size:14px;color:var(--text);line-height:1.6;margin-bottom:9px}
.ri-react{display:flex;gap:8px}
.ri-btn{background:var(--cream);border:1px solid var(--line);border-radius:6px;padding:3px 11px;font-size:11px;cursor:pointer;color:var(--text)}
.ri-btn.on-l{background:#e8f5e9;border-color:#4caf50;color:#2e7d32}
.ri-btn.on-d{background:#fce4ec;border-color:#e91e63;color:#880e4f}
.empty{text-align:center;padding:70px var(--pad);color:var(--muted)}
.empty button{margin-top:16px;background:var(--dark);color:#fff;border:none;padding:11px 26px;border-radius:999px;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px}

.agenda-layout{display:grid;grid-template-columns:1fr 1fr;gap:clamp(30px,5vw,60px);padding:clamp(40px,6vw,76px) var(--pad) clamp(26px,4vw,44px);align-items:start}
.agenda-intro h1{margin-bottom:4px}
.agenda-note{margin-top:30px;border-top:.5px solid var(--line);padding-top:22px;display:flex;flex-direction:column;gap:5px}
.agenda-note strong{font-size:13px;color:var(--dark)}
.agenda-note span{font-size:13px;color:var(--muted);line-height:1.5}
.agenda-card{background:var(--white);border-radius:16px;padding:28px;border:.5px solid var(--line)}
.ag-field{margin-bottom:16px}
.ag-label{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);display:block;margin-bottom:7px}
.ag-input{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 14px;font-family:'Inter',sans-serif;font-size:14px;color:var(--text);background:var(--cream);outline:none}
.ag-input:focus{border-color:var(--wood)}
textarea.ag-input{resize:none;height:80px}
.ag-piezas{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.ag-chip{background:var(--cream2);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:8px;color:var(--dark)}
.ag-chip button{background:none;border:none;cursor:pointer;color:var(--muted);font-size:14px;line-height:1;padding:0}
.ag-add{background:transparent;border:1px dashed var(--wood);color:var(--wood);border-radius:999px;padding:7px 14px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif}
.ag-add-sel{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 13px;font-family:'Inter',sans-serif;font-size:13px;background:var(--cream);color:var(--text);margin-bottom:8px;outline:none}
.ag-submit{width:100%;background:var(--dark);color:#fff;border:none;padding:14px;border-radius:12px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;margin-top:6px}
.ag-submit:hover{background:var(--accent)}
.mis-citas-wrap{padding:0 var(--pad) clamp(54px,8vw,96px)}
.mc-title{font-family:'Fraunces',serif;font-size:20px;font-weight:500;margin-bottom:14px;color:var(--dark)}
.mc-item{background:var(--white);border-radius:12px;padding:16px;margin-bottom:10px;border:.5px solid var(--line)}
.mc-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.mc-date{font-weight:500;font-size:14px;color:var(--dark)}
.mc-badge{font-size:10px;padding:3px 10px;border-radius:999px;background:var(--cream2);color:var(--muted)}
.mc-badge.ok{background:#e8f5e9;color:#2e7d32}
.mc-piezas{font-size:12px;color:var(--muted);margin-top:6px}
.mc-nota{font-size:12px;color:var(--muted);margin-top:4px;font-style:italic}

.admin-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding:0 var(--pad) clamp(54px,8vw,84px)}
.admin-card{background:var(--white);border-radius:14px;padding:26px;cursor:pointer;border:.5px solid var(--line);transition:border-color .2s}
.admin-card:hover{border-color:var(--accent)}
.admin-card-ico{font-size:28px;margin-bottom:12px;color:var(--accent)}
.admin-card-title{font-family:'Fraunces',serif;font-size:18px;font-weight:500;margin-bottom:6px;color:var(--dark)}
.admin-card-desc{font-size:14px;color:var(--muted)}
#admin-prod-list,#admin-agenda-content{padding:0 var(--pad) clamp(54px,8vw,84px)}
.admin-prod-header{display:flex;justify-content:flex-end;padding:0 var(--pad) 18px}
.ap-new{background:var(--dark);color:#fff;border:none;padding:11px 22px;border-radius:999px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer}
.ap-new:hover{background:var(--accent)}
.admin-prod-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.admin-prod-card{background:var(--white);border-radius:12px;overflow:hidden;border:.5px solid var(--line)}
.admin-prod-card img{width:100%;aspect-ratio:4/5;object-fit:cover}
.apc-actions{display:flex;gap:8px;margin-top:10px}
.apc-btn-edit{flex:1;background:var(--cream2);color:var(--dark);border:1px solid var(--line);padding:8px;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;cursor:pointer}
.apc-btn-edit:hover{background:var(--cream)}
.apc-btn-del{background:#fce4ec;color:#880e4f;border:none;padding:8px 12px;border-radius:8px;font-size:14px;cursor:pointer}
.apc-btn-del:hover{background:#f8bbd0}
/* Modal de formulario de producto */
.modal-form{max-width:580px;text-align:left;max-height:88vh;overflow-y:auto}
.modal-form h2{font-family:'Fraunces',serif;font-weight:600;color:var(--dark);margin-bottom:18px;font-size:24px}
.pf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;margin-bottom:20px}
.pf-grid label{display:flex;flex-direction:column;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);gap:6px}
.pf-grid input,.pf-grid select,.pf-grid textarea{background:var(--cream);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-family:'Inter',sans-serif;font-size:14px;color:var(--dark);text-transform:none;letter-spacing:0}
.pf-grid input:focus,.pf-grid select:focus,.pf-grid textarea:focus{outline:none;border-color:var(--wood)}
.pf-grid input:disabled{background:rgba(0,0,0,.04);color:var(--muted)}
.pf-grid textarea{resize:vertical;font-family:'Inter',sans-serif}
.pf-full{grid-column:1 / -1}
.pf-actions{display:flex;gap:10px}
.pf-cancel{flex:1;background:var(--cream);color:var(--dark);border:1px solid var(--line);padding:12px;border-radius:10px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer}
.pf-cancel:hover{background:var(--cream2)}
.pf-save{flex:2;background:var(--dark);color:#fff;border:none;padding:12px;border-radius:10px;font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer}
.pf-save:hover{background:var(--accent)}
.pf-photos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;min-height:90px;padding:10px;background:var(--cream);border:1px dashed var(--line);border-radius:8px;margin-bottom:10px}
.pf-no-photos{grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;text-align:center;text-transform:none;letter-spacing:0}
.pf-thumb{position:relative;aspect-ratio:1;border-radius:6px;overflow:hidden;background:var(--dark)}
.pf-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.pf-thumb-del{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.7);color:#fff;border:none;width:22px;height:22px;border-radius:50%;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
.pf-thumb-del:hover{background:#c00}
.pf-photo-actions{display:flex;flex-direction:column;gap:8px}
.pf-photo-btn{background:var(--wood);color:#fff;border:none;padding:11px 18px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;text-transform:none;letter-spacing:0}
.pf-photo-btn:hover{background:var(--accent)}
.pf-photo-btn:disabled{opacity:.6;cursor:not-allowed}
.pf-url-toggle{font-size:12px;color:var(--muted);text-transform:none;letter-spacing:0}
.pf-url-toggle summary{cursor:pointer;padding:6px 0;user-select:none}
.pf-url-toggle summary:hover{color:var(--dark)}
.pf-url-toggle input{width:100%;background:var(--cream);border:1px solid var(--line);border-radius:6px;padding:8px 10px;font-size:13px;margin-top:6px;font-family:'Inter',sans-serif}
.pf-url-add{margin-top:6px;background:var(--cream2);color:var(--dark);border:1px solid var(--line);padding:7px 12px;border-radius:6px;font-size:12px;cursor:pointer}
.pf-url-add:hover{background:var(--cream)}
.apc-body{padding:14px}
.apc-name{font-family:'Fraunces',serif;font-size:15px;font-weight:500;margin-bottom:3px}
.apc-cat{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px}
.apc-btn{width:100%;background:var(--cream2);color:var(--dark);border:none;padding:9px;border-radius:8px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif}
.admin-cita{background:var(--white);border-radius:12px;padding:18px;margin-bottom:12px;border:.5px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.ac-name{font-weight:600;font-size:15px;color:var(--dark)}
.ac-info{font-size:14px;color:var(--muted);margin-top:4px}
.ac-actions{display:flex;gap:8px}
.ac-btn{border:none;padding:8px 15px;border-radius:8px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif}
.ac-confirm{background:#25D366;color:#fff}
.ac-confirm.done{background:var(--wood)}
.ac-del{background:#fce4ec;color:#880e4f}

@media(max-width:860px){
  .hero,.detail,.reviews-grid,.agenda-layout{grid-template-columns:1fr}
  .grid3{grid-template-columns:repeat(2,1fr)}
  .reviews-grid{gap:24px}
  .hero-img{max-height:440px}
  .detail-gallery>img{max-height:460px}
}
@media(max-width:640px){
  .topbar{display:none}
  body::before{content:"";position:fixed;top:0;left:0;right:0;height:14px;background:var(--dark);z-index:300;border-bottom:2px solid var(--accent-soft);box-shadow:0 3px 14px rgba(0,0,0,.18)}
  .wrap{padding-top:16px}
  .bottom-nav{display:flex;border-top:2px solid var(--accent-soft);box-shadow:0 -3px 14px rgba(0,0,0,.18)}
  .wrap{padding-bottom:calc(var(--bottom-h) + 10px)}
  .grid3{grid-template-columns:1fr 1fr;gap:14px}
  .coll-name{font-size:15px}
  .coll-desc{font-size:12px}
  .stats dt{font-size:22px}
  .filters{gap:8px}
  .filter-pill{padding:7px 15px;font-size:12px}
  .back-btn{margin-top:18px}
  .hero-title{font-size:32px;line-height:1.1}
  .hero-title br{display:none}
  .admin-prod-grid{grid-template-columns:1fr 1fr;gap:12px}
  .pf-grid{grid-template-columns:1fr}
  .display-1{font-size:32px}
  .display-2{font-size:24px}
  .lede{font-size:14px}
  .hero{padding-top:24px;gap:20px}
  .hero-img{max-height:300px}
  .page-intro{padding-top:24px}
}
@media(max-width:420px){
  .grid3{grid-template-columns:1fr 1fr;gap:10px}
  .coll-name{font-size:14px}
  .coll-desc{font-size:11px}
  .hero-title{font-size:28px}
  .display-1{font-size:28px}
}`;
  }

  getJS(): string {
    return `
const WA='526741044723';
let curProd='',prevPage='home',selStars=0,saves=[],curFilter='Todas';

// === Cloudinary: subida directa de imagenes desde el navegador ===
const CLOUDINARY_CLOUD='dtrz42fdl';
const CLOUDINARY_PRESET='pablos_productos';
async function uploadToCloudinary(file){
  if(!file)return null;
  if(file.size>10*1024*1024){alert('La imagen es muy grande (max 10MB)');return null;}
  const fd=new FormData();
  fd.append('file',file);
  fd.append('upload_preset',CLOUDINARY_PRESET);
  try{
    const res=await fetch('https://api.cloudinary.com/v1_1/'+CLOUDINARY_CLOUD+'/image/upload',{method:'POST',body:fd});
    if(!res.ok){const t=await res.text();console.error('Cloudinary error:',t);throw new Error('Upload failed');}
    const data=await res.json();
    return data.secure_url;
  }catch(e){
    console.error(e);
    alert('Error subiendo imagen: '+e.message);
    return null;
  }
}
let piezasInteres=[];

let products=[];
let productsLoaded=false;
const SEED_PRODUCTS=[
  {id:'cocina-nogal',name:'Cocina Nogal Bicolor',cat:'Cocina',badge:'Destacado',madera:'Nogal',medidas:'A medida',acabado:'Cuarzo blanco',imgs:['https://i.imgur.com/lWCfKuo.jpeg','https://i.imgur.com/Zs2ppDI.jpeg'],desc:'Cocina integral en madera nogal con gabinetes superiores blancos. Isla central con cubierta de cuarzo blanco y parrilla empotrada. Dise\u00F1o moderno que combina calidez y elegancia.'},
  {id:'cocina-negra',name:'Cocina Negra Premium',cat:'Cocina',badge:'Premium',madera:'Laminado negro mate',medidas:'A medida',acabado:'M\u00E1rmol negro',imgs:['https://i.imgur.com/6TCGqVu.jpeg','https://i.imgur.com/gOnkz6q.jpeg','https://i.imgur.com/jrhjkmi.jpeg'],desc:'Cocina completa en laminado negro mate con cubierta de m\u00E1rmol negro veteado e iluminaci\u00F3n LED perimetral en plaf\u00F3n. Acabados de lujo con herrajes en negro mate.'},
  {id:'cocina-clara',name:'Cocina Moderna Clara',cat:'Cocina',badge:'',madera:'Madera clara',medidas:'A medida',acabado:'Cuarzo blanco',imgs:['https://i.imgur.com/v9Bxedg.jpeg'],desc:'Cocina en madera clara con gabinetes superiores e inferiores y cubierta de cuarzo blanco. Dise\u00F1o limpio y luminoso ideal para espacios modernos.'},
  {id:'cocina-gris',name:'Cocina Gris M\u00E1rmol',cat:'Cocina',badge:'',madera:'Laminado gris',medidas:'A medida',acabado:'M\u00E1rmol negro',imgs:['https://i.imgur.com/4fs0O61.jpeg','https://i.imgur.com/8HDAKMh.jpeg'],desc:'Cocina en laminado gris oscuro con cubierta de m\u00E1rmol negro. Dise\u00F1o minimalista y elegante para cocinas modernas con acabados premium.'},
  {id:'mueble-tv',name:'Mueble TV con Panel',cat:'Sala',badge:'Destacado',madera:'Gris perla y madera',medidas:'A medida',acabado:'Panel texturizado',imgs:['https://i.imgur.com/2SAwlJ5.jpeg'],desc:'Mueble de TV con panel texturizado tipo list\u00F3n, nicho con cubierta de m\u00E1rmol para pantalla y librero lateral flotante con cajones. Combinaci\u00F3n de gris perla y madera.'},
  {id:'escritorio-l',name:'Escritorio en L',cat:'Oficina',badge:'Nuevo',madera:'Roble claro',medidas:'A medida',acabado:'Jaladores negros',imgs:['https://i.imgur.com/lZ1fS2j.jpeg','https://i.imgur.com/cw4Lt8P.jpeg','https://i.imgur.com/rcDZz1Y.jpeg'],desc:'Escritorio en forma de L con m\u00F3dulos de almacenaje superior y cajones laterales en madera roble claro con jaladores negros. Ideal para home office o despacho profesional.'},
  {id:'closet-moderno',name:'Closet con Cajonera',cat:'Rec\u00E1mara',badge:'',madera:'Laminado gris perla',medidas:'A medida',acabado:'Sin jalador',imgs:['https://i.imgur.com/wL6aV37.jpeg'],desc:'Closet empotrado con secci\u00F3n de cajonera y nichos de almacenaje abierto en laminado gris perla. Sistema de apertura sin jalador. Complementado con panel texturizado de pared.'},
];

const categories=[
  {name:'Cocina',img:'https://i.imgur.com/lWCfKuo.jpeg',desc:'El coraz\u00F3n del hogar.'},
  {name:'Sala',img:'https://i.imgur.com/2SAwlJ5.jpeg',desc:'Muebles que conversan con la luz.'},
  {name:'Rec\u00E1mara',img:'https://i.imgur.com/wL6aV37.jpeg',desc:'Espacios que invitan al descanso.'},
  {name:'Oficina',img:'https://i.imgur.com/lZ1fS2j.jpeg',desc:'Productividad con estilo.'},
];

// Cargar productos desde Firestore y suscribirse a cambios
let unsubProducts=null;
function subscribeProducts(){
  if(unsubProducts)unsubProducts();
  unsubProducts=window.fs.onProductosChange(async (snap)=>{
    if(snap.empty && !productsLoaded){
      // Primera vez: sembrar los productos iniciales
      productsLoaded=true;
      try{
        for(const p of SEED_PRODUCTS){
          await window.fs.addProducto({...p});
        }
      }catch(e){console.error('Error al sembrar productos',e);}
      return;
    }
    const arr=[];
    snap.forEach(d=>arr.push({_docId:d.id,...d.data()}));
    // Ordenar por id (los seed tienen ids string descriptivos)
    arr.sort((a,b)=>(a.id||'').localeCompare(b.id||''));
    products=arr;
    productsLoaded=true;
    // Re-renderizar la pagina activa
    const ac=document.querySelector('.page.active');
    if(ac){const pid=ac.id.replace('page-','');
      if(pid==='home')renderHome();
      if(pid==='catalog')renderCatalog();
      if(pid==='saved')renderSaved();
      if(pid==='admin-prod')renderAdminProd();
    }
  });
}

// Rese\u00F1as en memoria, sincronizadas con Firestore (subscribe al abrir detalle)
let comments={};
let unsubReviews=null;
function subscribeReviews(productoId){
  if(unsubReviews)unsubReviews();
  unsubReviews=window.fs.onResenasChange(productoId,(snap)=>{
    const arr=[];
    snap.forEach(d=>{const dd=d.data();arr.push({id:d.id,user:dd.user,userId:dd.userId,stars:dd.stars,text:dd.text,likes:dd.likes||0,dislikes:dd.dislikes||0,reacts:dd.reacts||{},date:formatDate(dd.createdAt),_ts:(dd.createdAt&&dd.createdAt.seconds)||0});});
    arr.sort((a,b)=>b._ts-a._ts);
    comments[productoId]=arr;
    if(document.getElementById('page-detail') && document.getElementById('page-detail').classList.contains('active'))renderReviews();
  });
}
function formatDate(ts){
  if(!ts||!ts.seconds)return 'ahora';
  const diff=(Date.now()/1000)-ts.seconds;
  if(diff<60)return 'ahora';
  if(diff<3600)return 'hace '+Math.floor(diff/60)+' min';
  if(diff<86400)return 'hace '+Math.floor(diff/3600)+' h';
  if(diff<2592000)return 'hace '+Math.floor(diff/86400)+' d\u00EDas';
  return new Date(ts.seconds*1000).toLocaleDateString();
}

function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

function collCardHTML(p,idx){
  const sv=saves.includes(p.id);
  return '<div class="coll-card" onclick="showDetail(\\''+p.id+'\\')">'+
    '<div class="coll-img"><img src="'+p.imgs[0]+'" alt="'+escapeHtml(p.name)+'" loading="lazy"/>'+
    (idx!=null?'<span class="coll-num">'+String(idx+1).padStart(2,'0')+'</span>':'')+
    '<button class="coll-save'+(sv?' saved':'')+'" onclick="event.stopPropagation();toggleSave(\\''+p.id+'\\')">'+(sv?'\u2665':'\u2661')+'</button></div>'+
    '<div class="coll-meta"><div><div class="coll-name">'+escapeHtml(p.name)+'</div><div class="coll-cat">'+p.cat+'</div></div>'+
    '<span class="coll-explore">Explorar \u2192</span></div>'+
    '<div class="coll-desc">'+escapeHtml(p.desc.split('.')[0])+'.</div></div>';
}

function setNav(id){
  document.querySelectorAll('.tb-link,.bn-item').forEach(n=>n.classList.remove('active'));
  ['nav-','bn-'].forEach(pre=>{const e=document.getElementById(pre+id);if(e)e.classList.add('active')});
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg=document.getElementById('page-'+id);
  if(pg)pg.classList.add('active');
  setNav(id);
  if(id==='catalog')renderCatalog();
  if(id==='saved')renderSaved();
  if(id==='agenda')renderAgendaForm();
  if(id==='admin-prod')renderAdminProd();
  if(id==='admin-agenda')renderAdminAgenda();
  window.scrollTo(0,0);
}

function showCat(name){curFilter=name;showPage('catalog')}
function setFilter(name){curFilter=name;renderCatalog();}

function renderCatalog(){
  const fl=document.getElementById('filters');
  const cats=['Todas',...categories.map(c=>c.name)];
  fl.innerHTML=cats.map(c=>'<button class="filter-pill'+(c===curFilter?' active':'')+'" onclick="setFilter(\\''+c+'\\')">'+c+'</button>').join('');
  const list=curFilter==='Todas'?products:products.filter(p=>p.cat===curFilter);
  document.getElementById('catalog-count').textContent=list.length+' pieza'+(list.length!==1?'s':'')+' disponible'+(list.length!==1?'s':'')+'. Cada una se elabora bajo pedido.';
  document.getElementById('catalog-grid').innerHTML=list.map((p,i)=>collCardHTML(p,i)).join('');
}

function showDetail(id){
  const active=document.querySelector('.page.active');
  prevPage=active?active.id.replace('page-',''):'home';
  const p=products.find(x=>x.id===id);
  if(!p)return;
  curProd=id;
  document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active'));
  document.getElementById('page-detail').classList.add('active');
  document.getElementById('d-img').src=p.imgs[0];
  document.getElementById('d-cat').textContent=p.cat;
  document.getElementById('d-name').textContent=p.name;
  document.getElementById('d-desc').textContent=p.desc;
  document.getElementById('d-specs').innerHTML=
    '<div class="spec-row"><span>Material</span><span>'+escapeHtml(p.madera)+'</span></div>'+
    '<div class="spec-row"><span>Medidas</span><span>'+escapeHtml(p.medidas)+'</span></div>'+
    '<div class="spec-row"><span>Acabado</span><span>'+escapeHtml(p.acabado)+'</span></div>'+
    '<div class="spec-row"><span>Producci\u00F3n</span><span>4 \u2013 6 semanas</span></div>';
  const te=document.getElementById('d-thumbs');
  if(p.imgs.length>1){
    te.innerHTML=p.imgs.map((img,i)=>'<div class="thumb'+(i===0?' active':'')+'" onclick="switchImg(\\''+img+'\\',this)"><img src="'+img+'" loading="lazy"/></div>').join('');
    te.style.display='flex';
  }else{te.innerHTML='';te.style.display='none';}
  updSaveBtn();
  comments[curProd]=comments[curProd]||[];
  renderReviews();
  subscribeReviews(curProd);
  window.scrollTo(0,0);
}

function switchImg(src,el){
  document.getElementById('d-img').src=src;
  document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}
function goBack(){showPage(prevPage==='detail'?'home':prevPage)}

function updSaveBtn(){
  const sv=saves.includes(curProd);
  const b=document.getElementById('d-save');
  b.textContent=sv?'\u2665 Guardado':'\u2661 Guardar';
  b.classList.toggle('saved',sv);
}

function renderReviews(){
  const cs=comments[curProd]||[];
  const rf=document.getElementById('review-form');
  if(window.currentUser){
    rf.innerHTML='<h4>Deja tu rese\u00F1a</h4>'+
      '<div class="rf-stars">Calificaci\u00F3n: '+[1,2,3,4,5].map(i=>'<span class="rf-star" onclick="setStar('+i+')">\u2605</span>').join('')+'</div>'+
      '<textarea class="rf-input" id="rf-text" placeholder="Cuenta tu experiencia..."></textarea>'+
      '<button class="rf-submit" onclick="submitReview()">Publicar rese\u00F1a</button>';
  }else{
    rf.innerHTML='<div class="rf-locked" onclick="authAction()">\uD83D\uDD12 <b>Inicia sesi\u00F3n</b> para dejar una rese\u00F1a</div>';
  }
  const list=document.getElementById('reviews-list');
  if(!cs.length){list.innerHTML='<p style="font-size:13px;color:var(--muted);font-style:italic">A\u00FAn sin rese\u00F1as. S\u00E9 el primero en compartir tu experiencia.</p>';return;}
  list.innerHTML=cs.map((c,i)=>
    '<div class="review-item"><div class="ri-top"><div class="ri-av">'+escapeHtml(c.user[0])+'</div>'+
    '<div><div class="ri-name">'+escapeHtml(c.user)+'</div><div class="ri-date">'+c.date+'</div></div></div>'+
    '<div class="ri-stars">'+'\u2605'.repeat(c.stars)+'\u2606'.repeat(5-c.stars)+'</div>'+
    '<div class="ri-text">'+escapeHtml(c.text)+'</div>'+
    (()=>{const myR=(c.reacts&&window.currentUserId)?c.reacts[window.currentUserId]:null;return '<div class="ri-react"><button class="ri-btn'+(myR==='like'?' on-l':'')+'" onclick="react('+i+',\\'like\\')">\uD83D\uDC4D '+(c.likes||0)+'</button>'+
    '<button class="ri-btn'+(myR==='dislike'?' on-d':'')+'" onclick="react('+i+',\\'dislike\\')">\uD83D\uDC4E '+(c.dislikes||0)+'</button></div></div>'})()
  ).join('');
}
function setStar(n){selStars=n;document.querySelectorAll('.rf-star').forEach((s,i)=>s.classList.toggle('on',i<n))}
async function submitReview(){
  if(!window.currentUser)return;
  const t=document.getElementById('rf-text');
  const txt=t?t.value.trim():'';
  if(!txt||!selStars){alert('Escribe tu rese\u00F1a y selecciona una calificaci\u00F3n.');return;}
  try{
    await window.fs.addResena({productoId:curProd,user:window.currentUser,userId:window.currentUserId,stars:selStars,text:txt,likes:0,dislikes:0,reacts:{},createdAt:window.fs.now()});
    selStars=0;
    if(t)t.value='';
    document.querySelectorAll('.rf-star').forEach(s=>s.classList.remove('on'));
  }catch(e){console.error(e);alert('Error al publicar rese\u00F1a.');}
}
async function react(i,type){
  if(!window.currentUser){authAction();return;}
  const r=comments[curProd][i];if(!r)return;
  const uid=window.currentUserId;
  const reacts={...(r.reacts||{})};
  const prev=reacts[uid];
  let likes=r.likes||0, dislikes=r.dislikes||0;
  if(prev===type){delete reacts[uid];if(type==='like')likes--;else dislikes--;}
  else{if(prev==='like')likes--;if(prev==='dislike')dislikes--;reacts[uid]=type;if(type==='like')likes++;else dislikes++;}
  try{await window.fs.updateResena(r.id,{likes,dislikes,reacts});}
  catch(e){console.error(e);}
}

// Favoritos: mapa productoId -> docId, sincronizado con Firestore
let favsMap={};
let unsubFavs=null;
function subscribeFavorites(){
  if(unsubFavs){unsubFavs();unsubFavs=null;}
  favsMap={};
  if(!window.currentUserId)return;
  unsubFavs=window.fs.onFavoritosChange(window.currentUserId,(snap)=>{
    favsMap={};
    snap.forEach(d=>{const dd=d.data();favsMap[dd.productoId]=d.id;});
    saves=Object.keys(favsMap);
    const ac=document.querySelector('.page.active');
    if(ac){const pid=ac.id.replace('page-','');
      if(pid==='catalog')renderCatalog();
      if(pid==='saved')renderSaved();
      if(pid==='home')renderHome();
      if(pid==='detail')updSaveBtn();
    }
  });
}
async function toggleSave(id){
  if(!window.currentUser){authAction();return;}
  try{
    if(favsMap[id]){await window.fs.deleteFavorito(favsMap[id]);}
    else{await window.fs.addFavorito({userId:window.currentUserId,productoId:id,createdAt:window.fs.now()});}
  }catch(e){console.error(e);}
}
async function toggleSaveDetail(){
  if(!window.currentUser){authAction();return;}
  toggleSave(curProd);
}
function renderSaved(){
  const sc=document.getElementById('saved-content');
  if(!window.currentUser){sc.innerHTML='<div class="empty"><p>Inicia sesi\u00F3n para ver tus dise\u00F1os guardados</p><button onclick="authAction()">Iniciar sesi\u00F3n</button></div>';return;}
  const sv=products.filter(p=>saves.includes(p.id));
  sc.innerHTML=sv.length?'<div class="grid3" style="padding:0 var(--pad) 80px">'+sv.map((p,i)=>collCardHTML(p,i)).join('')+'</div>':'<div class="empty"><p>No tienes dise\u00F1os guardados a\u00FAn.<br>Explora el cat\u00E1logo y guarda tus favoritos.</p></div>';
}

function irAgenda(prodName){
  if(prodName&&!piezasInteres.includes(prodName))piezasInteres.push(prodName);
  showPage('agenda');
}
function solicitarPieza(){
  const p=products.find(x=>x.id===curProd);
  if(p&&!piezasInteres.includes(p.name))piezasInteres.push(p.name);
  showPage('agenda');
}
function renderAgendaForm(){
  const w=document.getElementById('agenda-form-wrap');
  if(!window.currentUser){
    w.innerHTML='<div class="rf-locked" onclick="authAction()" style="padding:30px">\uD83D\uDD12 <b>Inicia sesi\u00F3n</b> para agendar tu visita</div>';
    document.getElementById('mis-citas').innerHTML='';
    return;
  }
  const today=new Date().toISOString().split('T')[0];
  const opts=products.map(p=>'<option value="'+escapeHtml(p.name)+'">'+escapeHtml(p.name)+'</option>').join('');
  w.innerHTML=
    '<div class="ag-field"><label class="ag-label">Piezas de inter\u00E9s</label>'+
      '<div class="ag-piezas" id="ag-chips"></div>'+
      '<select class="ag-add-sel" id="ag-sel"><option value="">\u2014 Selecciona una pieza \u2014</option>'+opts+'<option value="__custom">Otra (pieza a medida)</option></select>'+
      '<button class="ag-add" onclick="agAddPieza()">+ Agregar pieza</button>'+
    '</div>'+
    '<div class="ag-field"><label class="ag-label">Fecha disponible</label><input type="date" class="ag-input" id="ag-fecha" min="'+today+'"/></div>'+
    '<div class="ag-field"><label class="ag-label">Hora de inicio</label><input type="time" class="ag-input" id="ag-hi"/></div>'+
    '<div class="ag-field"><label class="ag-label">Hora de fin</label><input type="time" class="ag-input" id="ag-hf"/></div>'+
    '<div class="ag-field"><label class="ag-label">Mensaje</label><textarea class="ag-input" id="ag-msg" placeholder="Cu\u00E9ntanos qu\u00E9 imaginas, medidas, madera preferida..."></textarea></div>'+
    '<button class="ag-submit" onclick="guardarCita()">Confirmar disponibilidad</button>';
  renderChips();
  cargarMisCitas();
}
function renderChips(){
  const c=document.getElementById('ag-chips');
  if(!c)return;
  c.innerHTML=piezasInteres.length?piezasInteres.map((p,i)=>'<span class="ag-chip">'+escapeHtml(p)+'<button onclick="agDelPieza('+i+')">\u2715</button></span>').join(''):'<span style="font-size:12px;color:var(--muted)">Sin piezas seleccionadas a\u00FAn</span>';
}
function agAddPieza(){
  const sel=document.getElementById('ag-sel');
  let v=sel.value;
  if(!v)return;
  if(v==='__custom'){v=prompt('Describe la pieza que quieres:');if(!v)return;}
  if(!piezasInteres.includes(v))piezasInteres.push(v);
  sel.value='';
  renderChips();
}
function agDelPieza(i){piezasInteres.splice(i,1);renderChips()}
async function guardarCita(){
  const f=document.getElementById('ag-fecha').value;
  const hi=document.getElementById('ag-hi').value;
  const hf=document.getElementById('ag-hf').value;
  const msg=document.getElementById('ag-msg').value.trim();
  if(!f||!hi||!hf){alert('Completa fecha y horas.');return;}
  if(hi>=hf){alert('La hora de fin debe ser despu\u00E9s de la de inicio.');return;}
  const piezas=[...piezasInteres];
  try{
    await window.fs.addCita({user:window.currentUser,userId:window.currentUserId,fecha:f,hi:hi,hf:hf,msg:msg,piezas:piezas,estado:'pendiente',createdAt:window.fs.now()});
  }catch(e){console.error(e);alert('Error al guardar la cita en la nube. Intenta de nuevo.');return;}

  // Construir mensaje para WhatsApp
  let wmsg='\u00A1Hola Pablo! Soy '+(window.currentUser||'un cliente')+'.';
  wmsg+='\\n\\nQuiero agendar una visita para que vengas a tomar medidas.';
  wmsg+='\\n\\n\uD83D\uDCC5 *Fecha:* '+f;
  wmsg+='\\n\uD83D\uDD52 *Horario:* '+hi+' \u2013 '+hf;
  if(piezas.length){
    wmsg+='\\n\\n\uD83E\uDDF5 *Piezas de inter\u00E9s:*';
    piezas.forEach(p=>{wmsg+='\\n  \u2022 '+p;});
  }
  if(msg){wmsg+='\\n\\n\uD83D\uDCDD *Mensaje:* '+msg;}
  wmsg+='\\n\\nQuedo atento a tu confirmaci\u00F3n. \u00A1Gracias!';
  const waUrl='https://wa.me/'+WA+'?text='+encodeURIComponent(wmsg);

  piezasInteres=[];
  renderAgendaForm();
  // Abrir WhatsApp en una nueva pesta\u00F1a
  window.open(waUrl,'_blank');
  alert('\u00A1Disponibilidad registrada! Se abrir\u00E1 WhatsApp para enviar el mensaje a Pablo.');
}
let unsubMisCitas=null;
let misCitasCache=[];
function cargarMisCitas(){
  if(!window.currentUserId){const el=document.getElementById('mis-citas');if(el)el.innerHTML='';return;}
  if(unsubMisCitas)unsubMisCitas();
  unsubMisCitas=window.fs.onMisCitasChange(window.currentUserId,(snap)=>{
    const arr=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));
    arr.sort((a,b)=>(b.createdAt&&b.createdAt.seconds||0)-(a.createdAt&&a.createdAt.seconds||0));
    misCitasCache=arr;
    renderMisCitas();
  });
}
function renderMisCitas(){
  const citas=misCitasCache;
  const el=document.getElementById('mis-citas');
  if(!el)return;
  if(!citas.length){el.innerHTML='';return;}
  el.innerHTML='<div class="mc-title">Mis solicitudes</div>'+citas.map(c=>{
    const horaI=c.hi||c.horaI||'--:--';
    const horaF=c.hf||c.horaF||'--:--';
    return '<div class="mc-item"><div class="mc-row"><span class="mc-date">\uD83D\uDCC5 '+c.fecha+' \u00B7 '+horaI+' \u2013 '+horaF+'</span>'+
    '<span class="mc-badge'+(c.estado==='confirmada'?' ok':'')+'">'+c.estado+'</span></div>'+
    (c.piezas&&c.piezas.length?'<div class="mc-piezas">Piezas: '+c.piezas.map(escapeHtml).join(', ')+'</div>':'')+
    (c.msg?'<div class="mc-nota">"'+escapeHtml(c.msg)+'"</div>':'')+'</div>';
  }).join('');
}

function renderAdminProd(){
  const el=document.getElementById('admin-prod-list');
  if(!el)return;
  const header='<div class="admin-prod-header"><button class="ap-new" onclick="openProdForm()">+ Nuevo producto</button></div>';
  const grid=products.map(p=>
    '<div class="admin-prod-card"><img src="'+p.imgs[0]+'"/><div class="apc-body">'+
    '<div class="apc-name">'+escapeHtml(p.name)+'</div><div class="apc-cat">'+p.cat+'</div>'+
    '<div class="apc-actions"><button class="apc-btn-edit" onclick="openProdForm(\\''+p._docId+'\\')">\u270F\uFE0F Editar</button>'+
    '<button class="apc-btn-del" onclick="deleteProduct(\\''+p._docId+'\\',\\''+escapeHtml(p.name).replace(/'/g,'')+'\\')">\uD83D\uDDD1\uFE0F</button></div></div></div>'
  ).join('');
  el.innerHTML=header+'<div class="admin-prod-grid">'+grid+'</div>';
}

function openProdForm(docId){
  const editing=!!docId;
  const p=editing?products.find(x=>x._docId===docId):{id:'',name:'',cat:'Cocina',badge:'',madera:'',medidas:'',acabado:'',desc:'',imgs:[]};
  if(!p){alert('Producto no encontrado');return;}
  const ov=document.createElement('div');
  ov.className='modal-overlay open'; ov.id='prod-form-overlay';
  ov.innerHTML='<div class="modal modal-form">'+
    '<button class="modal-close" onclick="closeProdForm()">\u2715</button>'+
    '<h2>'+(editing?'Editar producto':'Nuevo producto')+'</h2>'+
    '<div class="pf-grid">'+
      '<label>ID interno (sin espacios)<input id="pf-id" value="'+escapeHtml(p.id||'')+'" '+(editing?'disabled':'')+' placeholder="ej: cocina-roble"/></label>'+
      '<label>Nombre<input id="pf-name" value="'+escapeHtml(p.name||'')+'" placeholder="Cocina Nogal Bicolor"/></label>'+
      '<label>Categor\u00EDa<select id="pf-cat">'+
        ['Cocina','Sala','Rec\u00E1mara','Oficina'].map(c=>'<option value="'+c+'"'+(p.cat===c?' selected':'')+'>'+c+'</option>').join('')+
      '</select></label>'+
      '<label>Badge (opcional)<select id="pf-badge">'+
        ['','Destacado','Premium','Nuevo'].map(b=>'<option value="'+b+'"'+(p.badge===b?' selected':'')+'>'+(b||'(sin badge)')+'</option>').join('')+
      '</select></label>'+
      '<label>Madera/Material<input id="pf-madera" value="'+escapeHtml(p.madera||'')+'" placeholder="Nogal natural"/></label>'+
      '<label>Medidas<input id="pf-medidas" value="'+escapeHtml(p.medidas||'')+'" placeholder="3.2 \u00D7 0.6 m"/></label>'+
      '<label>Acabado<input id="pf-acabado" value="'+escapeHtml(p.acabado||'')+'" placeholder="Mate sat\u00EDn"/></label>'+
      '<label class="pf-full">Descripci\u00F3n<textarea id="pf-desc" rows="3" placeholder="Cocina hecha a medida con isla y barra...">'+escapeHtml(p.desc||'')+'</textarea></label>'+
      '<div class="pf-full"><label>Fotos (m\u00E1ximo 3)</label>'+
      '<div class="pf-photos" id="pf-photos-preview"></div>'+
      '<div class="pf-photo-actions"><input type="file" id="pf-file" accept="image/*" style="display:none" onchange="handleProdPhoto(event)"/>'+
        '<button type="button" class="pf-photo-btn" onclick="document.getElementById(\\'pf-file\\').click()">\uD83D\uDCC2 Subir foto</button>'+
        '<details class="pf-url-toggle"><summary>O pegar URL manualmente</summary>'+
          '<input type="text" id="pf-url-input" placeholder="URL de imagen"/>'+
          '<button type="button" class="pf-url-add" onclick="addUrlToProduct()">Agregar URL</button>'+
        '</details></div>'+
      '<textarea id="pf-imgs" style="display:none">'+(p.imgs||[]).join('\\n')+'</textarea></div>'+
    '</div>'+
    '<div class="pf-actions">'+
      '<button class="pf-cancel" onclick="closeProdForm()">Cancelar</button>'+
      '<button class="pf-save" onclick="saveProduct('+(editing?'\\''+docId+'\\'':'null')+')">'+(editing?'Guardar cambios':'Crear producto')+'</button>'+
    '</div></div>';
  document.body.appendChild(ov);
  renderPhotosPreview();
}

function closeProdForm(){
  const o=document.getElementById('prod-form-overlay');
  if(o)o.remove();
}

async function saveProduct(docId){
  const id=document.getElementById('pf-id').value.trim();
  const name=document.getElementById('pf-name').value.trim();
  const cat=document.getElementById('pf-cat').value;
  const badge=document.getElementById('pf-badge').value;
  const madera=document.getElementById('pf-madera').value.trim();
  const medidas=document.getElementById('pf-medidas').value.trim();
  const acabado=document.getElementById('pf-acabado').value.trim();
  const desc=document.getElementById('pf-desc').value.trim();
  const imgsRaw=document.getElementById('pf-imgs').value.trim();
  const imgs=imgsRaw.split('\\n').map(s=>s.trim()).filter(s=>s.length>0);
  if(!id||!name||!desc||imgs.length===0){
    alert('Faltan campos obligatorios: ID, nombre, descripci\u00F3n y al menos una foto.');return;
  }
  if(imgs.length>3){alert('M\u00E1ximo 3 fotos.');return;}
  const data={id,name,cat,badge,madera,medidas,acabado,desc,imgs};
  try{
    if(docId){
      await window.fs.updateProducto(docId,data);
    }else{
      if(products.some(p=>p.id===id)){
        alert('Ya existe un producto con ese ID. Usa otro.');return;
      }
      await window.fs.addProducto(data);
    }
    closeProdForm();
  }catch(e){
    console.error(e);
    alert('Error al guardar: '+e.message);
  }
}

// === Manejo de fotos en formulario admin ===
function getCurrentImgs(){
  const ta=document.getElementById('pf-imgs');
  if(!ta)return [];
  return ta.value.split('\\n').map(s=>s.trim()).filter(s=>s.length>0);
}
function setCurrentImgs(arr){
  const ta=document.getElementById('pf-imgs');
  if(ta)ta.value=arr.join('\\n');
  renderPhotosPreview();
}
function renderPhotosPreview(){
  const box=document.getElementById('pf-photos-preview');
  if(!box)return;
  const imgs=getCurrentImgs();
  if(!imgs.length){box.innerHTML='<div class="pf-no-photos">A\u00FAn no hay fotos. Sube una o pega una URL.</div>';return;}
  box.innerHTML=imgs.map((url,i)=>'<div class="pf-thumb"><img src="'+url+'" onerror="this.style.opacity=0.3"/><button type="button" class="pf-thumb-del" onclick="removePhoto('+i+')">\u2715</button></div>').join('');
}
function removePhoto(i){
  const imgs=getCurrentImgs();
  imgs.splice(i,1);
  setCurrentImgs(imgs);
}
function addUrlToProduct(){
  const inp=document.getElementById('pf-url-input');
  if(!inp)return;
  const url=inp.value.trim();
  if(!url)return;
  if(!url.startsWith('http')){alert('La URL debe empezar con http:// o https://');return;}
  const imgs=getCurrentImgs();
  if(imgs.length>=3){alert('M\u00E1ximo 3 fotos. Elimina una primero.');return;}
  imgs.push(url);
  setCurrentImgs(imgs);
  inp.value='';
}
async function handleProdPhoto(event){
  const file=event.target.files[0];
  if(!file)return;
  const imgs=getCurrentImgs();
  if(imgs.length>=3){alert('M\u00E1ximo 3 fotos. Elimina una primero.');event.target.value='';return;}
  const btn=document.querySelector('.pf-photo-btn');
  const origText=btn?btn.textContent:'';
  if(btn){btn.textContent='\u23F3 Subiendo...';btn.disabled=true;}
  const url=await uploadToCloudinary(file);
  if(btn){btn.textContent=origText;btn.disabled=false;}
  event.target.value='';
  if(url){
    imgs.push(url);
    setCurrentImgs(imgs);
  }
}

async function deleteProduct(docId,name){
  if(!confirm('\u00BFEliminar "'+name+'"?\\n\\nEsta acci\u00F3n no se puede deshacer.'))return;
  try{
    await window.fs.deleteProducto(docId);
  }catch(e){
    console.error(e);
    alert('Error al eliminar: '+e.message);
  }
}
let unsubAdminCitas=null;
let adminCitasCache=[];
function renderAdminAgenda(){
  if(!window.isAdmin)return;
  if(unsubAdminCitas)unsubAdminCitas();
  unsubAdminCitas=window.fs.onCitasChange((snap)=>{
    const arr=[];
    snap.forEach(d=>arr.push({id:d.id,...d.data()}));
    arr.sort((a,b)=>a.fecha.localeCompare(b.fecha));
    adminCitasCache=arr;
    drawAdminCitas();
  });
}
function drawAdminCitas(){
  const citas=adminCitasCache;
  const el=document.getElementById('admin-agenda-content');
  if(!el)return;
  if(!citas.length){el.innerHTML='<p style="color:var(--muted);font-size:14px">No hay solicitudes registradas a\u00FAn.</p>';return;}
  el.innerHTML=citas.map((c)=>{
    const horaI=c.hi||c.horaI||'--:--';
    const horaF=c.hf||c.horaF||'--:--';
    return '<div class="admin-cita"><div><div class="ac-name">\uD83D\uDC64 '+escapeHtml(c.user)+'</div>'+
    '<div class="ac-info">\uD83D\uDCC5 '+c.fecha+' \u00B7 '+horaI+' \u2013 '+horaF+'</div>'+
    (c.piezas&&c.piezas.length?'<div class="ac-info">\uD83E\uDDB5 '+c.piezas.map(escapeHtml).join(', ')+'</div>':'')+
    (c.msg?'<div class="ac-info">\uD83D\uDCDD '+escapeHtml(c.msg)+'</div>':'')+'</div>'+
    '<div class="ac-actions"><button class="ac-btn ac-confirm'+(c.estado==='confirmada'?' done':'')+'" onclick="cambiarCita(\\''+c.id+'\\')">'+(c.estado==='confirmada'?'\u2705 Confirmada':'Confirmar')+'</button>'+
    '<button class="ac-btn ac-del" onclick="eliminarCita(\\''+c.id+'\\')">Eliminar</button></div></div>';
  }).join('');
}
async function cambiarCita(id){
  const c=adminCitasCache.find(x=>x.id===id);if(!c)return;
  const nuevo=c.estado==='confirmada'?'pendiente':'confirmada';
  try{await window.fs.updateCita(id,{estado:nuevo});}catch(e){console.error(e);alert('Error al actualizar');}
}
async function eliminarCita(id){
  if(!confirm('\u00BFEliminar esta cita?'))return;
  try{await window.fs.deleteCita(id);}catch(e){console.error(e);alert('Error al eliminar');}
}

function openAuth(){document.getElementById('auth-modal').classList.add('open')}
function closeAuth(){document.getElementById('auth-modal').classList.remove('open')}

window.onAuthChange=function(){
  const lbl=document.getElementById('bn-acc-label');
  if(lbl)lbl.textContent=window.currentUser?'Salir':'Entrar';
  const ac=document.querySelector('.page.active');
  if(!ac)return;
  const pid=ac.id.replace('page-','');
  if(pid==='detail')renderReviews();
  if(pid==='saved')renderSaved();
  if(pid==='agenda')renderAgendaForm();
};

function renderHome(){
  document.getElementById('home-cats').innerHTML=categories.map((c,i)=>
    '<div class="coll-card" onclick="showCat(\\''+c.name+'\\')">'+
    '<div class="coll-img"><img src="'+c.img+'" alt="'+c.name+'" loading="lazy"/><span class="coll-num">'+String(i+1).padStart(2,'0')+'</span></div>'+
    '<div class="coll-meta"><div class="coll-name">'+c.name+'</div><span class="coll-explore">Explorar \u2192</span></div>'+
    '<div class="coll-desc">'+c.desc+'</div></div>'
  ).join('');
  document.getElementById('home-featured').innerHTML=products.filter(p=>p.badge).slice(0,3).map(p=>collCardHTML(p,null)).join('');
}

// Exponer funciones a window para que los onclick del HTML las encuentren
window.showPage=showPage;window.showCat=showCat;window.showDetail=showDetail;window.setFilter=setFilter;
window.switchImg=switchImg;window.goBack=goBack;window.toggleSave=toggleSave;
window.toggleSaveDetail=toggleSaveDetail;window.setStar=setStar;window.submitReview=submitReview;
window.react=react;window.irAgenda=irAgenda;window.solicitarPieza=solicitarPieza;
window.agAddPieza=agAddPieza;window.agDelPieza=agDelPieza;window.guardarCita=guardarCita;
window.cambiarCita=cambiarCita;window.eliminarCita=eliminarCita;window.openAuth=openAuth;
window.closeAuth=closeAuth;window.renderCatalog=renderCatalog;window.renderSaved=renderSaved;
window.renderAgendaForm=renderAgendaForm;window.renderAdminProd=renderAdminProd;
window.renderAdminAgenda=renderAdminAgenda;window.renderHome=renderHome;window.renderReviews=renderReviews;
window.subscribeProducts=subscribeProducts;window.subscribeFavorites=subscribeFavorites;
window.subscribeReviews=subscribeReviews;window.renderMisCitas=renderMisCitas;window.drawAdminCitas=drawAdminCitas;
window.openProdForm=openProdForm;window.closeProdForm=closeProdForm;window.saveProduct=saveProduct;window.deleteProduct=deleteProduct;
window.handleProdPhoto=handleProdPhoto;window.addUrlToProduct=addUrlToProduct;window.removePhoto=removePhoto;

// Arranque: suscribirse a productos (carga inicial) y mostrar Home
subscribeProducts();
renderHome();
`;
  }
}