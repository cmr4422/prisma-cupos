import { LUGARES, CONDUCTORES, CUPOS_BASE, RESPUESTAS_AUTO, RESPUESTAS_RAPIDAS, FAQ, TUTORIAL } from './data.js';
import { icon, logo } from './icons.js';

/* =========================================================
   Estado (se guarda en el navegador de cada persona)
   ========================================================= */
const KEY = 'prisma:v1';
const PASAJEROS = [
  { id: 'p1', nombre: 'Sofía Lozano', carrera: 'Psicología · Javeriana', color: '#DB2777' },
  { id: 'p2', nombre: 'Mateo Vargas', carrera: 'Ing. Civil · Univalle', color: '#2563EB' },
  { id: 'p3', nombre: 'Camila Herrera', carrera: 'Contaduría · UAO', color: '#9333EA' },
];
const CIUDADES = { Palmira: { lat: 3.5394, lng: -76.3036 }, Cali: { lat: 3.4516, lng: -76.532 } };

function defaults() {
  return {
    user: null,
    cuentas: [{ usuario: 'demo', password: 'prisma123', nombre: 'Estudiante Demo', telefono: '', vehiculo: null, foto: null }],
    onboarded: false,
    rol: 'pasajero',
    reservas: [],
    misCupos: [],
    finalizados: [],
    lugaresCustom: [],
    chats: {},
    avisos: [],
    filtros: { q: '', dia: 0, sentido: 'todos', franja: 'todas', minCupos: 1 },
  };
}
let state = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.cuentas) return { ...defaults(), ...s, filtros: { ...defaults().filtros, ...(s.filtros || {}) } }; } catch (e) { /* sin almacenamiento */ }
  return defaults();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento */ } }

/* Horas de los cupos de hoy: se calculan desde la hora actual para que siempre haya cupos próximos. */
const OFFS = { k1: 20, k2: 35, k3: 55, k4: 80, k5: 125, k6: 175, k7: 240, k8: 310 };
const BASE = CUPOS_BASE.map((c) => {
  if (c.dia !== 0 || OFFS[c.id] == null) return c;
  const d = new Date(Date.now() + OFFS[c.id] * 60000);
  const mins = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 5) * 5;
  const sameDay = d.getDate() === new Date().getDate() && mins < 24 * 60;
  const m = mins % (24 * 60);
  return { ...c, dia: sameDay ? 0 : 1, hora: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` };
});

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
const first = (n) => String(n || '').split(' ')[0];
const iniciales = (n) => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const diaLabel = (d) => (d === 0 ? 'Hoy' : 'Mañana');
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const fechaLarga = (dia) => { const d = new Date(Date.now() + dia * 86400000); return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }); };
const uid = (p) => p + Math.random().toString(36).slice(2, 8);

function lugar(id) { return LUGARES.find((l) => l.id === id) || state.lugaresCustom.find((l) => l.id === id) || { id, nombre: 'Lugar', dir: '', ciudad: '', lat: CIUDADES.Palmira.lat, lng: CIUDADES.Palmira.lng }; }
function persona(id) {
  if (id === 'me') return { id: 'me', nombre: state.user?.nombre || 'Tú', color: '#0B7C80', foto: state.user?.foto, vehiculo: state.user?.vehiculo, carrera: 'Conductor', rating: 5, viajes: 0 };
  return CONDUCTORES.find((c) => c.id === id) || PASAJEROS.find((p) => p.id === id);
}
function avatar(p, cls = '') {
  if (p?.foto) return `<span class="avatar ${cls}"><img src="${p.foto}" alt=""></span>`;
  return `<span class="avatar ${cls}" style="background:${p?.color || '#0B7C80'}">${esc(iniciales(p?.nombre))}</span>`;
}
function franjaDe(h) { const x = parseInt(h, 10); return x < 9 ? 'temprano' : x < 12 ? 'manana' : x < 17 ? 'tarde' : 'noche'; }
function sentidoDe(c) { const a = lugar(c.origen).ciudad, b = lugar(c.destino).ciudad; return a === 'Palmira' && b === 'Cali' ? 'pc' : a === 'Cali' && b === 'Palmira' ? 'cp' : 'otro'; }

function cupos() {
  return [...BASE, ...state.misCupos].map((c) => {
    const ocupados = c.conductorId === 'me' ? (c.pasajeros || []).length : c.ocupados + (state.reservas.includes(c.id) ? 1 : 0);
    return { ...c, ocupados, libres: Math.max(0, c.total - ocupados), finalizado: state.finalizados.includes(c.id) };
  });
}
const cupo = (id) => cupos().find((c) => c.id === id);

/* =========================================================
   UI: avisos, hojas inferiores, errores de formulario
   ========================================================= */
function toast(msg, type = 'ok') {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === 'error' ? 'alert' : 'checkCircle')}<span>${esc(msg)}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3200);
}
function openSheet(html) {
  $('#sheet-root').innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  setTimeout(() => $('.sheet input, .sheet button.btn')?.focus?.({ preventScroll: true }), 320);
}
function closeSheet() { $('#sheet-root').innerHTML = ''; }

function field({ name, label, type = 'text', placeholder = '', ic, value = '', hint = '', attrs = '' }) {
  const pw = type === 'password';
  return `<label class="field" data-field="${name}">
    <span class="label">${label}</span>
    <span class="input-wrap">${ic ? icon(ic) : ''}<input class="input" name="${name}" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" ${attrs}>${pw ? `<button type="button" class="icon-btn pw-toggle" data-action="toggle-pw" aria-label="Mostrar contraseña">${icon('eye')}</button>` : ''}</span>
    <span class="error" role="alert">${icon('alert')}<span></span></span>
    ${hint ? `<span class="hint">${hint}</span>` : ''}
  </label>`;
}
function showErrors(form, errs) {
  form.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
  const keys = Object.keys(errs);
  keys.forEach((k) => { const f = form.querySelector(`[data-field="${k}"]`); if (f) { f.classList.add('has-error'); f.querySelector('.error span').textContent = errs[k]; } });
  if (keys.length) { form.querySelector(`[data-field="${keys[0]}"] .input`)?.focus(); }
  return keys.length === 0;
}

/* =========================================================
   Mapas (Leaflet + rutas reales con OSRM; si no hay internet, línea directa)
   ========================================================= */
let maps = [];
const routeCache = {};
function km(a, b) { const R = 6371, t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLo = (b.lng - a.lng) * t; const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
async function getRoute(a, b) {
  const k = `${a.lat},${a.lng};${b.lat},${b.lng}`;
  if (routeCache[k]) return routeCache[k];
  let res;
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`, { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json(); const rt = j.routes[0];
    res = { coords: rt.geometry.coordinates.map(([x, y]) => [y, x]), km: rt.distance / 1000, min: rt.duration / 60 };
  } catch (e) {
    const d = km(a, b) * 1.3; res = { coords: [[a.lat, a.lng], [b.lat, b.lng]], km: d, min: (d / 40) * 60, aprox: true };
  }
  return (routeCache[k] = res);
}
function makeMap(el, a, b, { interactive = false, onRoute, me } = {}) {
  if (!el) return;
  if (!window.L) { el.innerHTML = `<div class="empty"><p>No se pudo cargar el mapa. Revisa tu conexión.</p></div>`; return; }
  const map = L.map(el, { zoomControl: false, dragging: interactive, scrollWheelZoom: interactive, touchZoom: interactive, doubleClickZoom: interactive, boxZoom: false, keyboard: false, tap: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
  const mk = (p, c) => L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="mk ${c}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(map);
  mk(a, 'a'); mk(b, 'b');
  map.fitBounds([[a.lat, a.lng], [b.lat, b.lng]], { padding: [48, 48] });
  maps.push(map);
  getRoute(a, b).then((r) => {
    if (!document.body.contains(el)) return;
    L.polyline(r.coords, { color: '#0A5E66', weight: 9, opacity: 0.25 }).addTo(map);
    const line = L.polyline(r.coords, { color: '#0EA5A0', weight: 5, opacity: 0.95, dashArray: r.aprox ? '8 8' : null }).addTo(map);
    map.fitBounds(line.getBounds(), interactive ? { paddingTopLeft: [40, 110], paddingBottomRight: [40, 250] } : { padding: [40, 40] });
    if (me) { const i = Math.floor(r.coords.length * 0.12); mk({ lat: r.coords[i][0], lng: r.coords[i][1] }, 'me'); }
    onRoute?.(r);
  });
  setTimeout(() => map.invalidateSize(), 300);
  return map;
}
function cleanupMaps() { maps.forEach((m) => { try { m.remove(); } catch (e) { /* ya removido */ } }); maps = []; }

/* =========================================================
   Componentes de pantalla
   ========================================================= */
function topbar(title, { back = true, right = '' } = {}) {
  return `<header class="topbar">${back ? `<button class="icon-btn" data-action="back" aria-label="Volver">${icon('back')}</button>` : ''}<h1>${title}</h1>${right}</header>`;
}
const helpBtn = (dark) => `<button class="icon-btn ${dark ? 'on-dark' : ''}" data-action="go" data-to="/ayuda" aria-label="Ayuda">${icon('help')}</button>`;

function tabbar(active) {
  const unread = Object.values(state.chats).some((c) => c.unread);
  const t = (to, ic, label, key) => `<a href="#${to}" ${active === key ? 'aria-current="page"' : ''}>${icon(ic)}${label}${key === 'msg' && unread ? '<i class="dot"></i>' : ''}</a>`;
  return `<nav class="tabbar" aria-label="Navegación principal">
    ${t('/inicio', 'home', 'Inicio', 'home')}
    ${t('/viajes', state.rol === 'conductor' ? 'route' : 'ticket', state.rol === 'conductor' ? 'Mis cupos' : 'Mis viajes', 'trips')}
    ${t('/mensajes', 'message', 'Mensajes', 'msg')}
    ${t('/perfil', 'user', 'Perfil', 'profile')}
  </nav>`;
}

function routeBlock(c) {
  const a = lugar(c.origen), b = lugar(c.destino);
  return `<div class="route">
    <div class="rail"><i></i><b></b><i class="end"></i></div>
    <p>${esc(a.nombre)}<small>${esc([a.dir, a.ciudad].filter(Boolean).join(', '))}</small></p>
    <p>${esc(b.nombre)}<small>${esc([b.dir, b.ciudad].filter(Boolean).join(', '))}</small></p>
  </div>`;
}
function libresBadge(c) {
  if (c.finalizado) return `<span class="badge grey">${icon('flag')}Finalizado</span>`;
  if (c.libres === 0) return `<span class="badge danger">${icon('users')}Lleno</span>`;
  if (c.libres === 1) return `<span class="badge warn">${icon('users')}1 cupo libre</span>`;
  return `<span class="badge">${icon('users')}${c.libres} cupos libres</span>`;
}
function cupoCard(c) {
  const d = persona(c.conductorId);
  const reservado = state.reservas.includes(c.id);
  return `<a class="card cupo" href="#/cupo/${c.id}" aria-label="Cupo de ${esc(d.nombre)} a ${esc(lugar(c.destino).nombre)} a las ${c.hora}">
    <div class="cupo-top">
      ${avatar(d)}
      <div class="meta">
        <div class="driver">${esc(d.nombre)}</div>
        <div class="sub">${icon('star')}${d.rating?.toFixed(1) ?? '5.0'} · ${esc(d.vehiculo?.modelo || '')}</div>
      </div>
      <div class="time-pill"><strong>${c.hora}</strong><span>${diaLabel(c.dia)}</span></div>
    </div>
    ${routeBlock(c)}
    <div class="cupo-foot">
      ${reservado ? `<span class="badge ok">${icon('check')}Reservado</span>` : libresBadge(c)}
      <span class="badge grey"><span class="plate" style="font-size:11px;padding:0 5px;border-width:1.5px">${esc(d.vehiculo?.placa || '')}</span></span>
      <span class="price">${money(c.aporte)}</span>
    </div>
  </a>`;
}

/* =========================================================
   Pantallas
   ========================================================= */
const V = {};

V.carga = () => `<section class="screen brand-screen"><div class="splash">${logo('light', 120)}<div class="word">Prisma</div><div class="dots"><i></i><i></i><i></i><i></i></div></div></section>`;

V.bienvenida = () => `<section class="screen brand-screen">
  <div class="welcome">
    <div class="center">${logo('light', 132)}<h1>Prisma</h1><p>Encuentra y comparte cupos de transporte universitario entre Palmira y Cali, sin depender del grupo de WhatsApp.</p></div>
    <div class="actions">
      <a class="btn btn-light btn-block" href="#/login">Iniciar sesión</a>
      <a class="btn btn-outline-light btn-block" href="#/registro">Crear cuenta</a>
      <button class="demo-link" data-action="demo">Explorar sin registrarme</button>
    </div>
  </div>
</section>`;

V.login = () => `<section class="screen brand-screen"><div class="auth">
  <div class="auth-head"><button class="icon-btn on-dark" data-action="back" aria-label="Volver">${icon('back')}</button>
    <div class="titles">${logo('light', 54)}<div><h1>Iniciar sesión</h1><p>Qué bueno verte de nuevo</p></div></div></div>
  <div class="auth-body">
    <form data-form="login" novalidate>
      <div class="notice mt-0" style="margin-bottom:18px">${icon('info')}<span>¿Solo quieres probar? Usa el usuario <b>demo</b> y la contraseña <b>prisma123</b>.</span></div>
      ${field({ name: 'usuario', label: 'Usuario', ic: 'user', placeholder: 'Tu usuario o correo', attrs: 'autocomplete="username" autocapitalize="none"' })}
      ${field({ name: 'password', label: 'Contraseña', type: 'password', ic: 'shield', placeholder: 'Tu contraseña', attrs: 'autocomplete="current-password"' })}
      <button class="btn btn-primary btn-block mt-8" type="submit">Entrar</button>
      <p class="switch-link">¿No tienes cuenta? <a href="#/registro">Regístrate</a></p>
    </form>
  </div></div></section>`;

let regRol = 'pasajero';
V.registro = () => `<section class="screen brand-screen"><div class="auth">
  <div class="auth-head"><button class="icon-btn on-dark" data-action="back" aria-label="Volver">${icon('back')}</button>
    <div class="titles">${logo('light', 54)}<div><h1>Crear cuenta</h1><p>Te toma menos de un minuto</p></div></div></div>
  <div class="auth-body">
    <form data-form="registro" novalidate>
      ${field({ name: 'nombre', label: 'Nombre completo', ic: 'user', placeholder: 'Ej. Laura Gómez', attrs: 'autocomplete="name"' })}
      ${field({ name: 'usuario', label: 'Usuario o correo institucional', ic: 'message', placeholder: 'Ej. laura.gomez', attrs: 'autocapitalize="none" autocomplete="username"' })}
      ${field({ name: 'telefono', label: 'Número de contacto (opcional)', type: 'tel', ic: 'phone', placeholder: 'Ej. 3151234567', hint: 'Solo lo verá el conductor o pasajero con quien reserves.', attrs: 'inputmode="numeric" autocomplete="tel"' })}
      ${field({ name: 'password', label: 'Contraseña', type: 'password', ic: 'shield', placeholder: 'Mínimo 6 caracteres', hint: 'Usa al menos 6 caracteres y un número.', attrs: 'autocomplete="new-password"' })}
      <span class="label" style="display:block;font-size:14px;font-weight:700;margin:4px 0 8px;color:var(--ink-2)">¿Cómo vas a usar Prisma?</span>
      <div class="segmented" role="group" aria-label="Tipo de usuario">
        <button type="button" class="seg-opt" data-action="reg-rol" data-rol="pasajero" aria-pressed="${regRol === 'pasajero'}">${icon('ticket')}<strong>Pasajero</strong><small>Busco y reservo cupos</small></button>
        <button type="button" class="seg-opt" data-action="reg-rol" data-rol="conductor" aria-pressed="${regRol === 'conductor'}">${icon('wheel')}<strong>Conductor</strong><small>Publico cupos en mi carro</small></button>
      </div>
      <p class="muted mt-8" style="font-size:13px">Podrás cambiar de rol cuando quieras desde Inicio.</p>
      <div id="veh-fields" class="mt-16" ${regRol === 'conductor' ? '' : 'hidden'}>
        ${vehiculoFields()}
      </div>
      <button class="btn btn-primary btn-block mt-16" type="submit">Crear cuenta</button>
      <p class="switch-link">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
    </form>
  </div></div></section>`;

function vehiculoFields(v = {}) {
  return `${field({ name: 'modelo', label: 'Marca y modelo del vehículo', ic: 'car', placeholder: 'Ej. KIA Picanto', value: v.modelo || '' })}
  <div class="row" style="align-items:flex-start">
    <div style="flex:1">${field({ name: 'placa', label: 'Placa', ic: 'ticket', placeholder: 'ABC123', value: v.placa || '', attrs: 'autocapitalize="characters" maxlength="7"' })}</div>
    <div style="flex:1">${field({ name: 'color', label: 'Color', placeholder: 'Ej. Blanco', value: v.color || '' })}</div>
  </div>`;
}
function validarVehiculo(fd, errs) {
  const modelo = String(fd.get('modelo') || '').trim(), placa = String(fd.get('placa') || '').trim().toUpperCase().replace(/[\s-]/g, ''), color = String(fd.get('color') || '').trim();
  if (modelo.length < 3) errs.modelo = 'Escribe la marca y el modelo, por ejemplo “Mazda 2”.';
  if (!/^[A-Z]{3}\d{2}[A-Z0-9]$/.test(placa)) errs.placa = 'La placa debe tener 3 letras y 3 números, por ejemplo ABC123.';
  if (color.length < 3) errs.color = 'Indica el color para que te reconozcan.';
  return { modelo, placa, color };
}

let tutIdx = 0;
V.tutorial = () => {
  const s = TUTORIAL[tutIdx], last = tutIdx === TUTORIAL.length - 1;
  return `<section class="screen"><div class="tutorial">
    <button class="skip" data-action="tut-end">Saltar</button>
    <div class="slide"><div class="art">${icon(s.icono)}</div><h2>${s.titulo}</h2><p>${s.texto}</p></div>
    <div class="bottom">
      <div class="steps">${TUTORIAL.map((_, i) => `<i class="${i === tutIdx ? 'on' : ''}"></i>`).join('')}</div>
      <div class="row">
        ${tutIdx > 0 ? `<button class="btn btn-ghost" data-action="tut-prev" aria-label="Anterior">${icon('back')}</button>` : ''}
        <button class="btn btn-primary" style="flex:1" data-action="${last ? 'tut-end' : 'tut-next'}">${last ? 'Comenzar' : 'Siguiente'}</button>
      </div>
    </div>
  </div></section>`;
};

/* ---------- Inicio ---------- */
function hero(sub) {
  const u = state.user;
  return `<header class="hero-head">
    <div class="hero-row">
      <a href="#/perfil" aria-label="Ir a mi perfil">${avatar({ ...u, color: 'rgba(255,255,255,.25)' })}</a>
      <div class="who"><div class="hello">${sub}</div><div class="name">Hola, ${esc(first(u.nombre))} 👋</div></div>
      ${helpBtn(true)}
    </div>
    <div class="role-switch" data-role="${state.rol}" role="group" aria-label="Cambiar tipo de usuario">
      <span class="thumb"></span>
      <button data-action="set-rol" data-rol="pasajero" aria-pressed="${state.rol === 'pasajero'}">${icon('ticket')}Pasajero</button>
      <button data-action="set-rol" data-rol="conductor" aria-pressed="${state.rol === 'conductor'}">${icon('wheel')}Conductor</button>
    </div>
    ${state.rol === 'pasajero' ? `<form class="search-bar" data-form="buscar" role="search">
      <label class="input-wrap">${icon('search')}<span class="sr-only">Buscar destino</span><input class="input" name="q" type="search" placeholder="¿A dónde vas? Ej. Javeriana" value="${esc(state.filtros.q)}" autocomplete="off"></label>
      <button type="button" class="filter-btn" data-action="filtros" aria-label="Filtros">${icon('filter')}${filtrosActivos() ? `<span class="count">${filtrosActivos()}</span>` : ''}</button>
    </form>` : ''}
  </header>`;
}
function filtrosActivos() { const f = state.filtros; return (f.sentido !== 'todos') + (f.franja !== 'todas') + (f.minCupos > 1); }
function filtrarCupos() {
  const f = state.filtros, q = norm(f.q);
  return cupos()
    .filter((c) => c.conductorId !== 'me' && !c.finalizado && c.dia === f.dia)
    .filter((c) => !q || norm(`${lugar(c.destino).nombre} ${lugar(c.origen).nombre} ${lugar(c.destino).ciudad} ${persona(c.conductorId).nombre}`).includes(q))
    .filter((c) => f.sentido === 'todos' || sentidoDe(c) === f.sentido)
    .filter((c) => f.franja === 'todas' || franjaDe(c.hora) === f.franja)
    .filter((c) => c.libres >= f.minCupos || state.reservas.includes(c.id))
    .sort((a, b) => a.hora.localeCompare(b.hora));
}

V.inicio = () => (state.rol === 'conductor' ? inicioConductor() : inicioPasajero());

function inicioPasajero() {
  const f = state.filtros;
  const lista = filtrarCupos();
  const proximas = cupos().filter((c) => state.reservas.includes(c.id) && !c.finalizado);
  const chip = (k, v, label, ic = '') => `<button class="chip" data-action="chip" data-k="${k}" data-v="${v}" aria-pressed="${String(f[k]) === String(v)}">${ic ? icon(ic) : ''}${label}</button>`;
  return `<section class="screen">
    ${hero(fechaLarga(0).replace(/^./, (m) => m.toUpperCase()))}
    <div class="scroll with-nav"><div class="pad">
      ${proximas.length ? `<div class="section-title"><h2>Tu próximo viaje</h2></div>
        <a class="card list-item" href="#/cupo/${proximas[0].id}" style="border:1.5px solid var(--teal-300)">
          <span class="lead-ic">${icon('checkCircle')}</span>
          <span class="grow"><strong>${diaLabel(proximas[0].dia)} ${proximas[0].hora} · ${esc(lugar(proximas[0].destino).nombre)}</strong><small>Con ${esc(persona(proximas[0].conductorId).nombre)} · <span class="plate" style="font-size:10px;padding:0 4px;border-width:1px">${esc(persona(proximas[0].conductorId).vehiculo.placa)}</span></small></span>
          ${icon('chevron', 'chev')}
        </a>` : ''}
      <div class="chips mt-16" role="group" aria-label="Día">
        ${chip('dia', 0, 'Hoy', 'calendar')}${chip('dia', 1, 'Mañana', 'calendar')}
        ${chip('sentido', 'pc', 'Palmira → Cali')}${chip('sentido', 'cp', 'Cali → Palmira')}
      </div>
      <div class="section-title"><h2>Cupos disponibles</h2><span>${lista.length} ${lista.length === 1 ? 'resultado' : 'resultados'}</span></div>
      ${lista.length ? `<div class="cupos-list">${lista.map(cupoCard).join('')}</div>` : sinCupos()}
    </div></div>
    ${tabbar('home')}
  </section>`;
}

function sinCupos() {
  const f = state.filtros;
  const sug = [];
  if (f.dia === 0) sug.push(`<button class="btn btn-primary" data-action="chip" data-k="dia" data-v="1">Ver cupos de mañana</button>`);
  if (f.q || filtrosActivos()) sug.push(`<button class="btn btn-ghost" data-action="limpiar-filtros">Quitar búsqueda y filtros</button>`);
  sug.push(`<button class="btn btn-ghost" data-action="aviso">${icon('bell')}Avisarme cuando haya cupo</button>`);
  return `<div class="card empty">
    <div class="art">${icon('search')}</div>
    <h3>No encontramos cupos${f.q ? ` para “${esc(f.q)}”` : ''}</h3>
    <p>${f.q ? 'Revisa cómo escribiste el destino o prueba con otro cercano.' : 'Prueba con otro horario o día, o cambia el sentido del viaje.'} También podemos avisarte cuando un conductor publique uno.</p>
    <div class="actions">${sug.join('')}</div>
  </div>`;
}

function inicioConductor() {
  const mios = cupos().filter((c) => c.conductorId === 'me');
  const activos = mios.filter((c) => !c.finalizado);
  const pasajeros = activos.reduce((n, c) => n + c.ocupados, 0);
  return `<section class="screen">
    ${hero('Modo conductor')}
    <div class="scroll with-nav"><div class="pad">
      ${!state.user.vehiculo ? `<div class="notice warn">${icon('alert')}<span>Agrega los datos de tu vehículo para poder publicar cupos. <a href="#" data-action="vehiculo">Agregar vehículo</a></span></div>` : `
      <div class="card list-item" style="border-radius:16px">
        <span class="lead-ic">${icon('car')}</span>
        <span class="grow"><strong>${esc(state.user.vehiculo.modelo)}</strong><small>${esc(state.user.vehiculo.color)} · <span class="plate" style="font-size:11px;padding:0 5px;border-width:1.5px">${esc(state.user.vehiculo.placa)}</span></small></span>
        <button class="icon-btn" data-action="vehiculo" aria-label="Editar vehículo">${icon('edit')}</button>
      </div>`}
      <div class="stats" style="margin-top:14px">
        <div class="stat card" style="background:#fff"><small>Cupos activos</small><strong>${activos.length}</strong></div>
        <div class="stat card" style="background:#fff"><small>Pasajeros</small><strong>${pasajeros}</strong></div>
      </div>
      <div class="section-title"><h2>Mis cupos publicados</h2>${activos.length ? `<span>${activos.length} activos</span>` : ''}</div>
      ${activos.length ? `<div class="cupos-list">${activos.sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora)).map(cupoConductorCard).join('')}</div>` : `
        <div class="card empty"><div class="art">${icon('wheel')}</div><h3>Aún no tienes cupos publicados</h3>
        <p>Publica tu viaje y los estudiantes que van hacia tu destino podrán reservar al instante.</p>
        <div class="actions"><button class="btn btn-primary" data-action="publicar">${icon('plus')}Publicar mi primer cupo</button></div></div>`}
    </div></div>
    ${activos.length ? `<button class="fab" data-action="publicar">${icon('plus')}Publicar cupo</button>` : ''}
    ${tabbar('home')}
  </section>`;
}
function cupoConductorCard(c) {
  return `<a class="card cupo" href="#/cupo/${c.id}">
    <div class="cupo-top"><div class="meta"><div class="driver">${diaLabel(c.dia)} · ${c.hora}</div><div class="sub" style="color:var(--muted)">${esc(fechaLarga(c.dia))}</div></div>
    <div class="time-pill"><strong>${c.ocupados}/${c.total}</strong><span>reservados</span></div></div>
    ${routeBlock(c)}
    <div class="cupo-foot">${libresBadge(c)}<span class="price">${money(c.aporte)}</span></div>
  </a>`;
}

/* ---------- Detalle de cupo ---------- */
V.cupo = (id) => {
  const c = cupo(id);
  if (!c) return noEncontrado('Este cupo ya no existe', 'Puede que el conductor lo haya eliminado.');
  const d = persona(c.conductorId), mio = c.conductorId === 'me', reservado = state.reservas.includes(c.id);
  const seats = Array.from({ length: c.total }, (_, i) => `<i class="${i < c.ocupados ? 'taken' : ''}"></i>`).join('');
  return `<section class="screen">
    ${topbar(mio ? 'Mi cupo publicado' : 'Detalle del cupo', { right: helpBtn() })}
    <div class="scroll">
      <div id="map" class="map"></div>
      <div class="card detail-card">
        ${mio ? '' : `<div class="driver-row">${avatar(d, 'lg')}<div style="flex:1;min-width:0"><h2>${esc(d.nombre)}</h2><div class="sub">${esc(d.carrera)}</div>
          <div class="row mt-8 wrap"><span class="badge">${icon('star')}${d.rating.toFixed(1)}</span><span class="badge grey">${d.viajes} viajes</span></div></div></div>`}
        ${routeBlock(c)}
        <div class="stats">
          <div class="stat"><small>Salida</small><strong>${diaLabel(c.dia)} · ${c.hora}</strong></div>
          <div class="stat"><small>Aporte</small><strong>${money(c.aporte)}</strong></div>
          <div class="stat"><small>Vehículo</small><strong>${esc(d.vehiculo?.modelo || '')}</strong><span class="muted" style="font-size:13px">${esc(d.vehiculo?.color || '')}</span></div>
          <div class="stat"><small>Placa</small><strong><span class="plate">${esc(d.vehiculo?.placa || '')}</span></strong></div>
          <div class="stat" style="grid-column:1/-1"><small>Cupos</small><div class="row between"><div class="seats">${seats}</div>${libresBadge(c)}</div></div>
          <div class="stat" style="grid-column:1/-1"><small>Punto de encuentro</small><strong style="font-size:15px;font-weight:700">${esc(c.encuentro || 'Por definir con el conductor')}</strong></div>
          <div class="stat" style="grid-column:1/-1"><small>Distancia y tiempo estimado</small><strong id="eta">Calculando ruta…</strong></div>
        </div>
        ${mio ? pasajerosBlock(c) : ''}
        ${reservado ? `<div class="notice mt-16">${icon('checkCircle')}<span><b>Tienes este cupo reservado.</b> Llega 5 minutos antes al punto de encuentro.</span></div>` : ''}
        ${!mio && !reservado && c.libres === 0 && !c.finalizado ? `<div class="notice warn mt-16">${icon('alert')}<span>Este cupo se llenó. <a href="#/inicio">Mira otros cupos</a> a la misma hora o activa un aviso.</span></div>` : ''}
        ${c.finalizado ? `<div class="notice mt-16">${icon('flag')}<span>Este cupo fue finalizado.</span></div>` : ''}
      </div>
      <div style="height:16px"></div>
    </div>
    <div class="bottom-cta">${detalleCTA(c, mio, reservado)}</div>
  </section>`;
};
function pasajerosBlock(c) {
  const ps = (c.pasajeros || []).map(persona);
  return `<div class="section-title"><h2>Pasajeros</h2><span>${ps.length}/${c.total}</span></div>
  ${ps.length ? `<div class="card list">${ps.map((p) => `<a class="list-item" href="#/chat/${p.id}">${avatar(p, 'sm')}<span class="grow"><strong>${esc(p.nombre)}</strong><small>${esc(p.carrera)}</small></span>${icon('message', 'chev')}</a>`).join('')}</div>`
    : `<p class="muted" style="font-size:14px">Todavía nadie ha reservado. Te avisaremos cuando alguien lo haga.</p>`}`;
}
function detalleCTA(c, mio, reservado) {
  if (c.finalizado) return `<a class="btn btn-ghost" href="#/inicio">Volver al inicio</a>`;
  if (mio) return `<button class="btn btn-ghost icon-only" data-action="go" data-to="/ruta/${c.id}" aria-label="Ver ruta">${icon('nav')}</button><button class="btn btn-danger" data-action="finalizar" data-id="${c.id}">${icon('flag')}Finalizar cupo</button>`;
  const chat = `<button class="btn btn-ghost icon-only" data-action="go" data-to="/chat/${c.conductorId}" aria-label="Escribir al conductor">${icon('message')}</button>`;
  if (reservado) return `${chat}<button class="btn btn-ghost icon-only" data-action="go" data-to="/ruta/${c.id}" aria-label="Ver ruta">${icon('nav')}</button><button class="btn btn-danger" data-action="cancelar" data-id="${c.id}">Cancelar reserva</button>`;
  if (c.libres === 0) return `${chat}<button class="btn btn-primary" disabled>Cupo lleno</button>`;
  return `${chat}<button class="btn btn-primary" data-action="reservar" data-id="${c.id}">Reservar cupo · ${money(c.aporte)}</button>`;
}
function mountDetalle(id) {
  const c = cupo(id); if (!c) return;
  makeMap($('#map'), lugar(c.origen), lugar(c.destino), {
    onRoute: (r) => { const e = $('#eta'); if (e) e.textContent = `${r.km.toFixed(1)} km · ${Math.round(r.min)} min aprox.`; },
  });
}

/* ---------- Ruta / navegación ---------- */
V.ruta = (id) => {
  const c = cupo(id);
  if (!c) return noEncontrado('Ruta no disponible', 'No encontramos este viaje.');
  const d = persona(c.conductorId);
  return `<section class="screen"><div class="nav-screen">
    <div id="map" class="map tall"></div>
    <div class="nav-top"><button class="icon-btn" data-action="back" aria-label="Volver">${icon('back')}</button>
      <div class="eta"><strong id="eta">Calculando…</strong><small>Salida ${diaLabel(c.dia).toLowerCase()} a las ${c.hora}</small></div></div>
    <div class="nav-panel"><div class="grab"></div>
      ${routeBlock(c)}
      <div class="row between" style="padding-top:12px;border-top:1px dashed var(--line)">
        <div class="row">${avatar(d, 'sm')}<div><strong style="font-size:14.5px">${esc(d.nombre)}</strong><div class="muted" style="font-size:12.5px">${esc(d.vehiculo?.modelo || '')} · <span class="plate" style="font-size:10px;padding:0 4px;border-width:1px">${esc(d.vehiculo?.placa || '')}</span></div></div></div>
        ${c.conductorId === 'me' ? '' : `<button class="btn btn-teal btn-sm" data-action="go" data-to="/chat/${c.conductorId}">${icon('message')}Chat</button>`}
      </div>
    </div>
  </div></section>`;
};
function mountRuta(id) {
  const c = cupo(id); if (!c) return;
  makeMap($('#map'), lugar(c.origen), lugar(c.destino), {
    interactive: true, me: true,
    onRoute: (r) => { const e = $('#eta'); if (e) e.textContent = `${Math.round(r.min)} min · ${r.km.toFixed(1)} km`; },
  });
}

/* ---------- Mis viajes / Mis cupos ---------- */
V.viajes = () => {
  if (state.rol === 'conductor') {
    const mios = cupos().filter((c) => c.conductorId === 'me');
    const act = mios.filter((c) => !c.finalizado), fin = mios.filter((c) => c.finalizado);
    return `<section class="screen">${topbar('Mis cupos', { back: false, right: helpBtn() })}
      <div class="scroll with-nav"><div class="pad">
        <div class="section-title" style="margin-top:4px"><h2>Activos</h2><span>${act.length}</span></div>
        ${act.length ? `<div class="cupos-list">${act.map(cupoConductorCard).join('')}</div>` : `<div class="card empty"><div class="art">${icon('route')}</div><h3>Sin cupos activos</h3><p>Cuando publiques un cupo lo verás aquí.</p><div class="actions"><button class="btn btn-primary" data-action="publicar">${icon('plus')}Publicar cupo</button></div></div>`}
        ${fin.length ? `<div class="section-title"><h2>Finalizados</h2><span>${fin.length}</span></div><div class="cupos-list">${fin.map(cupoConductorCard).join('')}</div>` : ''}
      </div></div>${tabbar('trips')}</section>`;
  }
  const res = cupos().filter((c) => state.reservas.includes(c.id));
  return `<section class="screen">${topbar('Mis viajes', { back: false, right: helpBtn() })}
    <div class="scroll with-nav"><div class="pad">
      ${res.length ? `<div class="cupos-list">${res.sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora)).map(cupoCard).join('')}</div>` : `<div class="card empty"><div class="art">${icon('ticket')}</div><h3>Aún no tienes viajes</h3><p>Reserva un cupo y aquí verás la hora, el punto de encuentro y el chat con el conductor.</p><div class="actions"><a class="btn btn-primary" href="#/inicio">Buscar cupos</a></div></div>`}
    </div></div>${tabbar('trips')}</section>`;
};

/* ---------- Mensajes y chat ---------- */
V.mensajes = () => {
  const ids = Object.keys(state.chats).filter((k) => state.chats[k].msgs.length).sort((a, b) => (state.chats[b].ts || 0) - (state.chats[a].ts || 0));
  return `<section class="screen">${topbar('Mensajes', { back: false, right: helpBtn() })}
    <div class="scroll with-nav"><div class="pad">
      ${ids.length ? `<div class="card list">${ids.map((id) => {
        const p = persona(id), ch = state.chats[id], last = ch.msgs[ch.msgs.length - 1];
        return `<a class="list-item" href="#/chat/${id}">${avatar(p)}<span class="grow"><strong>${esc(p.nombre)}</strong><small>${last.from === 'me' ? 'Tú: ' : ''}${esc(last.text)}</small></span>${ch.unread ? '<span class="badge" style="background:var(--blue-600);color:#fff">Nuevo</span>' : icon('chevron', 'chev')}</a>`;
      }).join('')}</div>` : `<div class="card empty"><div class="art">${icon('message')}</div><h3>No tienes conversaciones</h3><p>Desde el detalle de un cupo puedes escribirle al conductor para coordinar el punto de encuentro.</p><div class="actions"><a class="btn btn-primary" href="#/inicio">Ver cupos</a></div></div>`}
    </div></div>${tabbar('msg')}</section>`;
};

function chatOf(id) { return (state.chats[id] ||= { msgs: [], ts: 0, unread: false }); }
function pushMsg(id, from, text) { const ch = chatOf(id); ch.msgs.push({ from, text, t: nowHM() }); ch.ts = Date.now(); if (from !== 'me' && from !== 'sys') ch.unread = !location.hash.endsWith(`/chat/${id}`); save(); }
function bubbles(id) {
  const ch = chatOf(id);
  if (!ch.msgs.length) return `<div class="sys-msg">Escribe para coordinar el punto de encuentro</div>`;
  return ch.msgs.map((m) => (m.from === 'sys' ? `<div class="sys-msg">${esc(m.text)}</div>` : `<div class="bubble ${m.from === 'me' ? 'me' : 'them'}">${esc(m.text)}<time>${m.t}</time></div>`)).join('');
}
V.chat = (id) => {
  const p = persona(id);
  if (!p) return noEncontrado('Conversación no encontrada', '');
  chatOf(id).unread = false; save();
  return `<section class="screen">
    <header class="topbar"><button class="icon-btn" data-action="back" aria-label="Volver">${icon('back')}</button>
      ${avatar(p, 'sm')}<div style="flex:1;min-width:0"><h1 style="font-size:16px">${esc(p.nombre)}</h1><div class="muted" style="font-size:12.5px">${p.vehiculo ? `${esc(p.vehiculo.modelo)} · ${esc(p.vehiculo.placa)}` : 'Pasajero'}</div></div>
    </header>
    <div class="chat-body" id="chat-body">${bubbles(id)}</div>
    <div class="quick"><div class="chips">${RESPUESTAS_RAPIDAS.map((r) => `<button class="chip" data-action="quick" data-text="${esc(r)}">${esc(r)}</button>`).join('')}</div></div>
    <form class="composer" data-form="chat" data-id="${id}"><label class="sr-only" for="msg">Mensaje</label><input id="msg" class="input" name="msg" placeholder="Escribe un mensaje…" autocomplete="off"><button class="send" type="submit" aria-label="Enviar">${icon('send')}</button></form>
  </section>`;
};
function refreshChat(id, typing = false) {
  const body = $('#chat-body'); if (!body || !location.hash.endsWith(`/chat/${id}`)) return;
  body.innerHTML = bubbles(id) + (typing ? '<div class="bubble them typing"><i></i><i></i><i></i></div>' : '');
  body.scrollTop = body.scrollHeight;
}
function enviar(id, text) {
  text = text.trim(); if (!text) return;
  pushMsg(id, 'me', text); refreshChat(id, true);
  setTimeout(() => {
    const r = id.startsWith('p') ? ['¡Listo! Ahí estaré 👍', 'Perfecto, gracias por avisar.', 'Dale, nos vemos en el punto de encuentro.'] : RESPUESTAS_AUTO;
    pushMsg(id, id, r[Math.floor(Math.random() * r.length)]);
    refreshChat(id);
  }, 1400 + Math.random() * 900);
}

/* ---------- Publicar cupo ---------- */
let pub = null;
function nuevoPub() { return { origen: 'unicentro-palmira', destino: 'uao', otro: false, otroNombre: '', otroCiudad: 'Cali', dia: 0, hora: '', total: 3, aporte: 8000, encuentro: '' }; }
V.publicar = () => {
  if (!state.user.vehiculo) return noEncontrado('Primero agrega tu vehículo', 'Necesitamos la placa y el modelo para que los pasajeros te reconozcan.', `<button class="btn btn-primary" data-action="vehiculo">Agregar vehículo</button>`);
  pub ||= nuevoPub();
  const opts = (sel) => ['Palmira', 'Cali'].map((ci) => `<optgroup label="${ci}">${LUGARES.filter((l) => l.ciudad === ci).map((l) => `<option value="${l.id}" ${sel === l.id ? 'selected' : ''}>${esc(l.nombre)}</option>`).join('')}</optgroup>`).join('');
  return `<section class="screen">${topbar('Publicar cupo', { right: helpBtn() })}
    <div class="scroll"><form class="pad" data-form="publicar" novalidate>
      <div class="notice" style="margin-bottom:18px">${icon('info')}<span>Completa los datos de tu viaje. Antes de publicar verás un resumen.</span></div>
      <label class="field" data-field="origen"><span class="label">Sales desde</span><select class="input" name="origen">${opts(pub.origen)}</select><span class="error">${icon('alert')}<span></span></span></label>
      <label class="field" data-field="destino"><span class="label">Vas hacia</span><select class="input" name="destino" data-action-change="destino">${opts(pub.destino)}<option value="__otro" ${pub.otro ? 'selected' : ''}>Otro destino (escribirlo)…</option></select><span class="error">${icon('alert')}<span></span></span></label>
      <div id="otro-wrap" ${pub.otro ? '' : 'hidden'}>
        ${field({ name: 'otroNombre', label: 'Escribe tu destino', ic: 'pin', placeholder: 'Ej. Hospital San Vicente de Paúl', value: pub.otroNombre })}
        <label class="field"><span class="label">Ciudad del destino</span><select class="input" name="otroCiudad"><option ${pub.otroCiudad === 'Palmira' ? 'selected' : ''}>Palmira</option><option ${pub.otroCiudad === 'Cali' ? 'selected' : ''}>Cali</option></select></label>
      </div>
      <span class="label" style="display:block;font-size:14px;font-weight:700;margin-bottom:8px;color:var(--ink-2)">¿Cuándo sales?</span>
      <div class="chips" style="margin-bottom:12px"><button type="button" class="chip" data-action="pub-dia" data-v="0" aria-pressed="${pub.dia === 0}">${icon('calendar')}Hoy</button><button type="button" class="chip" data-action="pub-dia" data-v="1" aria-pressed="${pub.dia === 1}">${icon('calendar')}Mañana</button></div>
      ${field({ name: 'hora', label: 'Hora de salida', type: 'time', ic: 'clock', value: pub.hora })}
      <div class="field" data-field="total"><span class="label">Cupos que ofreces</span>
        <div class="stepper"><button type="button" data-action="pub-total" data-d="-1" aria-label="Menos cupos">${icon('minus')}</button><output id="pub-total">${pub.total}</output><button type="button" data-action="pub-total" data-d="1" aria-label="Más cupos">${icon('plus')}</button><span class="muted" style="font-size:13.5px">máximo 4</span></div></div>
      ${field({ name: 'aporte', label: 'Aporte por pasajero (COP)', type: 'number', ic: 'money', value: pub.aporte, attrs: 'inputmode="numeric" min="0" step="500"' })}
      ${field({ name: 'encuentro', label: 'Punto de encuentro', ic: 'pin', placeholder: 'Ej. Portería principal', value: pub.encuentro, hint: 'Un lugar fácil de reconocer para tus pasajeros.' })}
      <button class="btn btn-primary btn-block mt-8" type="submit">Revisar y publicar</button>
      <div style="height:20px"></div>
    </form></div></section>`;
};
function leerPub(form) {
  const fd = new FormData(form);
  pub.origen = fd.get('origen'); const dest = fd.get('destino'); pub.otro = dest === '__otro'; if (!pub.otro) pub.destino = dest;
  pub.otroNombre = String(fd.get('otroNombre') || '').trim(); pub.otroCiudad = fd.get('otroCiudad') || 'Cali';
  pub.hora = fd.get('hora'); pub.aporte = Number(fd.get('aporte')); pub.encuentro = String(fd.get('encuentro') || '').trim();
}

/* ---------- Perfil ---------- */
V.perfil = () => {
  const u = state.user, cond = state.rol === 'conductor';
  return `<section class="screen"><div class="scroll with-nav">
    <div class="profile-head">${avatar({ ...u, color: 'rgba(255,255,255,.25)' }, 'lg')}<h2>${esc(u.nombre)}</h2><p>@${esc(u.usuario)} · ${cond ? 'Conductor' : 'Pasajero'}</p></div>
    <div class="pad" style="padding-top:0">
      <div class="card list profile-card">
        <a class="list-item" href="#/perfil/editar"><span class="lead-ic">${icon('edit')}</span><span class="grow"><strong>Editar perfil</strong><small>Foto, nombre y número de contacto</small></span>${icon('chevron', 'chev')}</a>
        <button class="list-item" data-action="vehiculo"><span class="lead-ic">${icon('car')}</span><span class="grow"><strong>Mi vehículo</strong><small>${u.vehiculo ? `${esc(u.vehiculo.modelo)} · ${esc(u.vehiculo.placa)}` : 'Agrega tu vehículo para ser conductor'}</small></span>${icon('chevron', 'chev')}</button>
        <button class="list-item" data-action="set-rol" data-rol="${cond ? 'pasajero' : 'conductor'}"><span class="lead-ic">${icon('swap')}</span><span class="grow"><strong>Cambiar a ${cond ? 'pasajero' : 'conductor'}</strong><small>Ahora estás en modo ${cond ? 'conductor' : 'pasajero'}</small></span>${icon('chevron', 'chev')}</button>
      </div>
      <div class="card list mt-16">
        <a class="list-item" href="#/ayuda"><span class="lead-ic">${icon('help')}</span><span class="grow"><strong>Ayuda y preguntas frecuentes</strong><small>Resuelve tus dudas sobre Prisma</small></span>${icon('chevron', 'chev')}</a>
        <button class="list-item" data-action="ver-tutorial"><span class="lead-ic">${icon('sparkle')}</span><span class="grow"><strong>Ver tutorial de nuevo</strong><small>Recorrido rápido por la app</small></span>${icon('chevron', 'chev')}</button>
      </div>
      <div class="card list mt-16">
        <button class="list-item" data-action="reset"><span class="lead-ic">${icon('trash')}</span><span class="grow"><strong>Reiniciar datos de demostración</strong><small>Borra reservas, chats y cupos publicados</small></span></button>
        <button class="list-item danger" data-action="logout"><span class="lead-ic">${icon('logout')}</span><span class="grow"><strong>Cerrar sesión</strong></span></button>
      </div>
      <p class="muted" style="text-align:center;font-size:12.5px;margin-top:20px">Prisma v2.0 · Prototipo funcional</p>
    </div></div>${tabbar('profile')}</section>`;
};
let fotoTmp;
V.editar = () => {
  const u = state.user; fotoTmp = u.foto;
  return `<section class="screen">${topbar('Editar perfil')}
    <div class="scroll"><form class="pad" data-form="editar" novalidate>
      <div class="avatar-edit"><span id="av-prev">${avatar(u)}</span><label class="cam" aria-label="Cambiar foto">${icon('camera')}<input type="file" accept="image/*" class="sr-only" data-action-change="foto"></label></div>
      ${field({ name: 'nombre', label: 'Nombre completo', ic: 'user', value: u.nombre })}
      ${field({ name: 'usuario', label: 'Usuario', ic: 'message', value: u.usuario, attrs: 'disabled', hint: 'El usuario no se puede cambiar.' })}
      ${field({ name: 'telefono', label: 'Número de contacto (opcional)', type: 'tel', ic: 'phone', value: u.telefono || '', attrs: 'inputmode="numeric"' })}
      <button class="btn btn-primary btn-block mt-8" type="submit">Guardar cambios</button>
    </form></div></section>`;
};

V.ayuda = () => `<section class="screen">${topbar('Ayuda')}
  <div class="scroll"><div class="pad">
    <div class="card" style="padding:18px;background:var(--grad-head);color:#fff;border:0">
      <div class="row">${icon('help')}<strong style="font-size:17px">¿En qué te ayudamos?</strong></div>
      <p style="margin-top:8px;opacity:.92;font-size:14.5px;line-height:1.5">Aquí encuentras cómo reservar, publicar y cambiar de rol. Si es tu primera vez, mira el tutorial.</p>
      <button class="btn btn-light btn-sm mt-12" data-action="ver-tutorial">${icon('sparkle')}Ver tutorial</button>
    </div>
    <div class="section-title"><h2>Preguntas frecuentes</h2></div>
    <div class="card">${FAQ.map((f) => `<details class="faq"><summary>${esc(f.q)}${icon('chevron')}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
    <div class="section-title"><h2>Glosario de botones</h2></div>
    <div class="card list">
      ${[['swap', 'Pasajero / Conductor', 'Cambia de rol en Inicio'], ['filter', 'Filtros', 'Horario, sentido y cupos libres'], ['message', 'Chat', 'Habla con el conductor o pasajero'], ['nav', 'Ruta', 'Mira el recorrido en el mapa'], ['flag', 'Finalizar cupo', 'Cierra un viaje publicado']]
        .map(([i, t, s]) => `<div class="list-item"><span class="lead-ic">${icon(i)}</span><span class="grow"><strong>${t}</strong><small>${s}</small></span></div>`).join('')}
    </div>
  </div></div></section>`;

function noEncontrado(t, s, extra = '') {
  return `<section class="screen">${topbar('')}<div class="scroll"><div class="pad"><div class="card empty"><div class="art">${icon('info')}</div><h3>${t}</h3><p>${s}</p><div class="actions">${extra || '<a class="btn btn-primary" href="#/inicio">Ir al inicio</a>'}</div></div></div></div></section>`;
}

/* =========================================================
   Hojas (bottom sheets)
   ========================================================= */
function sheetFiltros() {
  const f = state.filtros;
  const c = (k, v, l) => `<button type="button" class="chip" data-action="fchip" data-k="${k}" data-v="${v}" aria-pressed="${String(f[k]) === String(v)}">${l}</button>`;
  openSheet(`<h3>Filtrar cupos</h3><p class="desc">Ajusta la búsqueda a tu horario y necesidades.</p>
    <div class="mt-16"><span class="label" style="font-weight:700;font-size:14px">Sentido del viaje</span><div class="chips mt-8">${c('sentido', 'todos', 'Todos')}${c('sentido', 'pc', 'Palmira → Cali')}${c('sentido', 'cp', 'Cali → Palmira')}</div></div>
    <div class="mt-16"><span class="label" style="font-weight:700;font-size:14px">Horario de salida</span><div class="chips mt-8" style="flex-wrap:wrap">${c('franja', 'todas', 'Cualquiera')}${c('franja', 'temprano', 'Antes de 9 a.m.')}${c('franja', 'manana', '9 a.m. – 12 m.')}${c('franja', 'tarde', '12 m. – 5 p.m.')}${c('franja', 'noche', 'Después de 5 p.m.')}</div></div>
    <div class="mt-16"><span class="label" style="font-weight:700;font-size:14px">Cupos libres mínimos</span><div class="chips mt-8">${c('minCupos', 1, '1 o más')}${c('minCupos', 2, '2 o más')}${c('minCupos', 3, '3 o más')}</div></div>
    <div class="sheet-actions"><button class="btn btn-primary" data-action="aplicar-filtros">Ver resultados</button><button class="btn btn-ghost" data-action="limpiar-filtros">Limpiar filtros</button></div>`);
}
function sheetVehiculo(then) {
  const v = state.user.vehiculo || {};
  openSheet(`<div class="big-ic">${icon('car')}</div><h3>${state.user.vehiculo ? 'Mi vehículo' : 'Agrega tu vehículo'}</h3>
    <p class="desc">Los pasajeros verán estos datos para reconocerte al llegar.</p>
    <form class="mt-16" data-form="vehiculo" data-then="${then || ''}" novalidate>${vehiculoFields(v)}<button class="btn btn-primary btn-block" type="submit">Guardar vehículo</button></form>`);
}

/* =========================================================
   Acciones
   ========================================================= */
const stack = [];
function go(path, replace = false) {
  if (replace) { history.replaceState(null, '', '#' + path); stack[Math.max(0, stack.length - 1)] = path; render(); }
  else location.hash = path;
}

function entrar(user, nuevo = false) {
  state.user = user; state.rol = user.rolInicial || state.rol || 'pasajero'; delete user.rolInicial;
  save();
  if (nuevo || !state.onboarded) { tutIdx = 0; go('/tutorial'); } else go('/inicio');
}
function setRol(rol) {
  if (rol === state.rol) return;
  if (rol === 'conductor' && !state.user.vehiculo) { sheetVehiculo('rol'); return; }
  state.rol = rol; save(); render();
  toast(rol === 'conductor' ? 'Ahora estás en modo conductor' : 'Ahora estás en modo pasajero');
}
function simularReserva(id) {
  setTimeout(() => {
    const c = state.misCupos.find((x) => x.id === id);
    if (!c || state.finalizados.includes(id) || (c.pasajeros || []).length >= c.total) return;
    const p = PASAJEROS.find((x) => !(c.pasajeros || []).includes(x.id)); if (!p) return;
    c.pasajeros = [...(c.pasajeros || []), p.id];
    pushMsg(p.id, 'sys', `${first(p.nombre)} reservó tu cupo de las ${c.hora}`);
    pushMsg(p.id, p.id, `¡Hola! Acabo de reservar tu cupo de las ${c.hora}. ¿Nos vemos en ${c.encuentro || 'el punto de encuentro'}?`);
    save(); toast(`${p.nombre} reservó un cupo en tu viaje`);
    if (/\/(inicio|viajes|cupo|mensajes)/.test(location.hash) && !$('#sheet-root').innerHTML) render();
  }, 7000);
}

const actions = {
  'close-sheet': closeSheet,
  back: () => { if (stack.length > 1) history.back(); else go(state.user ? '/inicio' : '/bienvenida', true); },
  go: (el) => go(el.dataset.to),
  demo: () => {
    let acc = state.cuentas.find((a) => a.usuario === 'demo');
    entrar({ ...acc });
  },
  'toggle-pw': (el) => { const i = el.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.innerHTML = icon(show ? 'eyeOff' : 'eye'); el.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); },
  'reg-rol': (el) => { regRol = el.dataset.rol; document.querySelectorAll('[data-action="reg-rol"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.rol === regRol)); $('#veh-fields').hidden = regRol !== 'conductor'; },
  'tut-next': () => { tutIdx++; render(); },
  'tut-prev': () => { tutIdx = Math.max(0, tutIdx - 1); render(); },
  'tut-end': () => { state.onboarded = true; save(); go('/inicio', true); },
  'ver-tutorial': () => { tutIdx = 0; go('/tutorial'); },
  'set-rol': (el) => setRol(el.dataset.rol),
  chip: (el) => { const k = el.dataset.k; state.filtros[k] = k === 'dia' || k === 'minCupos' ? Number(el.dataset.v) : (String(state.filtros[k]) === el.dataset.v && k === 'sentido' ? 'todos' : el.dataset.v); save(); render(); },
  fchip: (el) => { const k = el.dataset.k; state.filtros[k] = k === 'minCupos' ? Number(el.dataset.v) : el.dataset.v; save(); el.parentElement.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', b === el)); },
  filtros: sheetFiltros,
  'aplicar-filtros': () => { closeSheet(); render(); },
  'limpiar-filtros': () => { state.filtros = { ...defaults().filtros, dia: state.filtros.dia }; save(); closeSheet(); render(); },
  aviso: () => { state.avisos.push({ q: state.filtros.q, dia: state.filtros.dia }); save(); toast('Te avisaremos cuando se publique un cupo para ti'); },
  reservar: (el) => {
    const c = cupo(el.dataset.id), d = persona(c.conductorId);
    openSheet(`<h3>Confirma tu reserva</h3><p class="desc">Revisa los datos antes de confirmar.</p>
      <div class="card summary mt-16">
        <div class="summary-row"><span>Conductor</span><strong>${esc(d.nombre)}</strong></div>
        <div class="summary-row"><span>Salida</span><strong>${diaLabel(c.dia)}, ${c.hora}</strong></div>
        <div class="summary-row"><span>Desde</span><strong>${esc(lugar(c.origen).nombre)}</strong></div>
        <div class="summary-row"><span>Hacia</span><strong>${esc(lugar(c.destino).nombre)}</strong></div>
        <div class="summary-row"><span>Encuentro</span><strong>${esc(c.encuentro)}</strong></div>
        <div class="summary-row"><span>Vehículo</span><strong>${esc(d.vehiculo.modelo)} · ${esc(d.vehiculo.placa)}</strong></div>
        <div class="summary-row" style="border-top:1px dashed var(--line);padding-top:10px"><span>Aporte</span><strong style="font-size:17px">${money(c.aporte)}</strong></div>
      </div>
      <p class="muted mt-12" style="font-size:13px">El aporte se paga directamente al conductor. Puedes cancelar la reserva desde “Mis viajes”.</p>
      <div class="sheet-actions"><button class="btn btn-primary" data-action="confirmar-reserva" data-id="${c.id}">Confirmar reserva</button><button class="btn btn-ghost" data-action="close-sheet">Volver</button></div>`);
  },
  'confirmar-reserva': (el) => {
    const c = cupo(el.dataset.id);
    if (!c || c.libres === 0) { closeSheet(); toast('Lo sentimos, el cupo se acaba de llenar. Mira otros cupos cercanos.', 'error'); render(); return; }
    state.reservas.push(c.id);
    pushMsg(c.conductorId, 'sys', `Reservaste el cupo de ${diaLabel(c.dia).toLowerCase()} a las ${c.hora}`);
    save(); render();
    openSheet(`<div class="big-ic ok">${icon('checkCircle')}</div><h3>¡Cupo reservado!</h3>
      <p class="desc">${esc(persona(c.conductorId).nombre)} te espera ${diaLabel(c.dia).toLowerCase()} a las <b>${c.hora}</b> en ${esc(c.encuentro)}.</p>
      <div class="sheet-actions"><button class="btn btn-primary" data-action="sheet-go" data-to="/chat/${c.conductorId}">${icon('message')}Escribir al conductor</button><button class="btn btn-ghost" data-action="sheet-go" data-to="/viajes">Ver mis viajes</button></div>`);
  },
  'sheet-go': (el) => { closeSheet(); go(el.dataset.to); },
  cancelar: (el) => {
    openSheet(`<div class="big-ic danger">${icon('alert')}</div><h3>¿Cancelar tu reserva?</h3><p class="desc">Liberarás el cupo para otro estudiante. Te recomendamos avisarle al conductor por el chat.</p>
      <div class="sheet-actions"><button class="btn btn-danger" data-action="confirmar-cancelar" data-id="${el.dataset.id}">Sí, cancelar reserva</button><button class="btn btn-ghost" data-action="close-sheet">No, mantenerla</button></div>`);
  },
  'confirmar-cancelar': (el) => { const c = cupo(el.dataset.id); state.reservas = state.reservas.filter((x) => x !== el.dataset.id); pushMsg(c.conductorId, 'sys', 'Cancelaste tu reserva'); save(); closeSheet(); render(); toast('Reserva cancelada'); },
  finalizar: (el) => {
    const c = cupo(el.dataset.id);
    openSheet(`<div class="big-ic">${icon('flag')}</div><h3>¿Finalizar este cupo?</h3><p class="desc">El cupo dejará de aparecer en las búsquedas. ${c.ocupados ? `Avisaremos a tus ${c.ocupados} pasajero(s).` : ''}</p>
      <div class="sheet-actions"><button class="btn btn-primary" data-action="confirmar-finalizar" data-id="${c.id}">Sí, finalizar cupo</button><button class="btn btn-ghost" data-action="close-sheet">Volver</button></div>`);
  },
  'confirmar-finalizar': (el) => { state.finalizados.push(el.dataset.id); save(); closeSheet(); toast('Cupo finalizado. ¡Buen viaje!'); go('/inicio'); },
  publicar: () => { pub = nuevoPub(); go('/publicar'); },
  'pub-dia': (el) => { pub.dia = Number(el.dataset.v); el.parentElement.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', b === el)); },
  'pub-total': (el) => { pub.total = Math.min(4, Math.max(1, pub.total + Number(el.dataset.d))); $('#pub-total').textContent = pub.total; },
  'confirmar-publicar': () => {
    let destino = pub.destino;
    if (pub.otro) { const base = CIUDADES[pub.otroCiudad]; const l = { id: uid('l'), nombre: pub.otroNombre, dir: 'Destino escrito por el conductor', ciudad: pub.otroCiudad, lat: base.lat + 0.004, lng: base.lng + 0.004 }; state.lugaresCustom.push(l); destino = l.id; }
    const c = { id: uid('m'), conductorId: 'me', origen: pub.origen, destino, dia: pub.dia, hora: pub.hora, total: pub.total, aporte: pub.aporte, encuentro: pub.encuentro, pasajeros: [] };
    state.misCupos.push(c); save(); closeSheet(); pub = null;
    toast('¡Tu cupo fue publicado!'); go('/inicio', true); simularReserva(c.id);
  },
  vehiculo: () => sheetVehiculo(),
  reset: () => {
    openSheet(`<div class="big-ic danger">${icon('trash')}</div><h3>¿Reiniciar la demostración?</h3><p class="desc">Se borrarán tus reservas, chats y cupos publicados. Tu cuenta se mantiene.</p>
      <div class="sheet-actions"><button class="btn btn-danger" data-action="confirmar-reset">Sí, reiniciar</button><button class="btn btn-ghost" data-action="close-sheet">Cancelar</button></div>`);
  },
  'confirmar-reset': () => { const keep = { user: state.user, cuentas: state.cuentas, onboarded: true }; state = { ...defaults(), ...keep }; save(); closeSheet(); go('/inicio'); render(); toast('Datos de demostración reiniciados'); },
  logout: () => { state.user = null; state.rol = 'pasajero'; save(); go('/bienvenida'); },
  quick: (el) => { const id = location.hash.split('/').pop(); enviar(id, el.dataset.text); },
};

const forms = {
  buscar: (f) => { state.filtros.q = String(new FormData(f).get('q') || '').trim(); save(); render(); },
  login: (f) => {
    const fd = new FormData(f), usuario = String(fd.get('usuario') || '').trim().toLowerCase(), pw = String(fd.get('password') || '');
    const errs = {};
    if (!usuario) errs.usuario = 'Escribe tu usuario o correo.';
    if (!pw) errs.password = 'Escribe tu contraseña.';
    if (!showErrors(f, errs)) return;
    const acc = state.cuentas.find((a) => a.usuario === usuario);
    if (!acc) return showErrors(f, { usuario: 'No encontramos una cuenta con ese usuario. Revisa cómo lo escribiste o crea una cuenta nueva.' });
    if (acc.password !== pw) return showErrors(f, { password: 'La contraseña no coincide. Inténtalo de nuevo (distingue mayúsculas y minúsculas).' });
    entrar({ ...acc });
  },
  registro: (f) => {
    const fd = new FormData(f), errs = {};
    const nombre = String(fd.get('nombre') || '').trim(), usuario = String(fd.get('usuario') || '').trim().toLowerCase(), telefono = String(fd.get('telefono') || '').replace(/\D/g, ''), password = String(fd.get('password') || '');
    if (nombre.split(' ').filter(Boolean).length < 2) errs.nombre = 'Escribe tu nombre y apellido para que el conductor te reconozca.';
    if (!/^[a-z0-9._@-]{4,}$/.test(usuario)) errs.usuario = 'Usa mínimo 4 caracteres, sin espacios (letras, números, punto o guion).';
    else if (state.cuentas.some((a) => a.usuario === usuario)) errs.usuario = 'Ese usuario ya está registrado. Prueba con otro o inicia sesión.';
    if (telefono && !/^3\d{9}$/.test(telefono)) errs.telefono = 'El celular debe tener 10 dígitos y empezar por 3, por ejemplo 3151234567.';
    if (password.length < 6 || !/\d/.test(password)) errs.password = 'La contraseña necesita al menos 6 caracteres y un número.';
    let vehiculo = null;
    if (regRol === 'conductor') vehiculo = validarVehiculo(fd, errs);
    if (!showErrors(f, errs)) return;
    const acc = { usuario, password, nombre, telefono, vehiculo, foto: null };
    state.cuentas.push(acc); state.onboarded = false;
    entrar({ ...acc, rolInicial: regRol }, true);
    toast('¡Cuenta creada! Bienvenido a Prisma');
  },
  vehiculo: (f) => {
    const errs = {}; const v = validarVehiculo(new FormData(f), errs);
    if (!showErrors(f, errs)) return;
    state.user.vehiculo = v; const acc = state.cuentas.find((a) => a.usuario === state.user.usuario); if (acc) acc.vehiculo = v;
    if (f.dataset.then === 'rol') { state.rol = 'conductor'; toast('Vehículo guardado. Ahora estás en modo conductor'); } else toast('Vehículo guardado');
    save(); closeSheet(); render();
  },
  publicar: (f) => {
    leerPub(f);
    const errs = {};
    if (!pub.otro && pub.origen === pub.destino) errs.destino = 'El destino no puede ser igual al punto de salida.';
    if (pub.otro && pub.otroNombre.length < 4) errs.otroNombre = 'Escribe el nombre del destino (mínimo 4 letras).';
    if (!pub.hora) errs.hora = 'Elige la hora de salida.';
    else if (pub.dia === 0 && pub.hora <= nowHM()) errs.hora = `Esa hora ya pasó (son las ${nowHM()}). Elige una hora posterior o cambia a “Mañana”.`;
    if (!(pub.aporte >= 0) || pub.aporte > 50000) errs.aporte = 'El aporte debe estar entre $0 y $50.000.';
    if (pub.encuentro.length < 4) errs.encuentro = 'Indica un punto de encuentro, por ejemplo “Portería principal”.';
    if (!showErrors(f, errs)) return;
    const dest = pub.otro ? pub.otroNombre : lugar(pub.destino).nombre, v = state.user.vehiculo;
    openSheet(`<h3>Revisa tu cupo</h3><p class="desc">Así lo verán los pasajeros.</p>
      <div class="card summary mt-16">
        <div class="summary-row"><span>Salida</span><strong>${diaLabel(pub.dia)}, ${pub.hora}</strong></div>
        <div class="summary-row"><span>Desde</span><strong>${esc(lugar(pub.origen).nombre)}</strong></div>
        <div class="summary-row"><span>Hacia</span><strong>${esc(dest)}</strong></div>
        <div class="summary-row"><span>Cupos</span><strong>${pub.total}</strong></div>
        <div class="summary-row"><span>Aporte</span><strong>${money(pub.aporte)}</strong></div>
        <div class="summary-row"><span>Encuentro</span><strong>${esc(pub.encuentro)}</strong></div>
        <div class="summary-row"><span>Vehículo</span><strong>${esc(v.modelo)} · ${esc(v.placa)}</strong></div>
      </div>
      <div class="sheet-actions"><button class="btn btn-primary" data-action="confirmar-publicar">${icon('check')}Publicar cupo</button><button class="btn btn-ghost" data-action="close-sheet">Editar</button></div>`);
  },
  editar: (f) => {
    const fd = new FormData(f), errs = {};
    const nombre = String(fd.get('nombre') || '').trim(), telefono = String(fd.get('telefono') || '').replace(/\D/g, '');
    if (nombre.split(' ').filter(Boolean).length < 2) errs.nombre = 'Escribe tu nombre y apellido.';
    if (telefono && !/^3\d{9}$/.test(telefono)) errs.telefono = 'El celular debe tener 10 dígitos y empezar por 3.';
    if (!showErrors(f, errs)) return;
    Object.assign(state.user, { nombre, telefono, foto: fotoTmp });
    const acc = state.cuentas.find((a) => a.usuario === state.user.usuario); if (acc) Object.assign(acc, { nombre, telefono, foto: fotoTmp });
    save(); toast('Cambios guardados'); go('/perfil');
  },
  chat: (f) => { const i = f.querySelector('input'); enviar(f.dataset.id, i.value); i.value = ''; i.focus(); },
};

const changes = {
  destino: (el) => { const otro = el.value === '__otro'; $('#otro-wrap').hidden = !otro; if (otro) $('#otro-wrap input')?.focus(); },
  foto: (el) => {
    const file = el.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Elige un archivo de imagen (JPG o PNG)', 'error'); return; }
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = 240, cv = document.createElement('canvas'); cv.width = cv.height = s; const ctx = cv.getContext('2d');
      const m = Math.min(img.width, img.height); ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      fotoTmp = cv.toDataURL('image/jpeg', 0.82); $('#av-prev').innerHTML = avatar({ foto: fotoTmp }); URL.revokeObjectURL(url);
    };
    img.onerror = () => toast('No pudimos leer esa imagen. Prueba con otra.', 'error');
    img.src = url;
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'SELECT') return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('submit', (e) => { const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault(); forms[f.dataset.form]?.(f); });
document.addEventListener('change', (e) => { const el = e.target.closest('[data-action-change]'); if (el) changes[el.dataset.actionChange]?.(el); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#sheet-root').innerHTML) closeSheet(); });

/* =========================================================
   Enrutador
   ========================================================= */
const PUBLICAS = ['/bienvenida', '/login', '/registro', '/carga'];
function render() {
  cleanupMaps(); closeSheet();
  const path = location.hash.slice(1) || '/';
  const [, a, b, c] = path.split('/');
  if (!state.user && !PUBLICAS.includes(path)) return go('/bienvenida', true);
  if (state.user && ['/bienvenida', '/login', '/registro', '/'].includes(path)) return go('/inicio', true);
  let html, mount;
  switch (a) {
    case 'carga': html = V.carga(); break;
    case 'bienvenida': html = V.bienvenida(); break;
    case 'login': html = V.login(); break;
    case 'registro': html = V.registro(); break;
    case 'tutorial': html = V.tutorial(); break;
    case 'inicio': html = V.inicio(); break;
    case 'cupo': html = V.cupo(b); mount = () => mountDetalle(b); break;
    case 'ruta': html = V.ruta(b); mount = () => mountRuta(b); break;
    case 'viajes': html = V.viajes(); break;
    case 'mensajes': html = V.mensajes(); break;
    case 'chat': html = V.chat(b); mount = () => { const body = $('#chat-body'); if (body) body.scrollTop = body.scrollHeight; }; break;
    case 'publicar': html = V.publicar(); break;
    case 'perfil': html = b === 'editar' ? V.editar() : V.perfil(); break;
    case 'ayuda': html = V.ayuda(); break;
    default: html = noEncontrado('Página no encontrada', 'El enlace que abriste no existe.');
  }
  $('#app').innerHTML = html;
  mount?.();
  document.title = `Prisma · ${{ inicio: 'Inicio', cupo: 'Cupo', ruta: 'Ruta', viajes: 'Mis viajes', mensajes: 'Mensajes', chat: 'Chat', publicar: 'Publicar cupo', perfil: 'Perfil', ayuda: 'Ayuda', login: 'Iniciar sesión', registro: 'Crear cuenta' }[a] || 'Cupos universitarios'}`;
}
window.addEventListener('hashchange', () => {
  const p = location.hash.slice(1) || '/';
  if (stack.length > 1 && stack[stack.length - 2] === p) stack.pop(); else stack.push(p);
  render();
});

/* QR para la vista de escritorio */
function initQR() {
  const url = location.href.split('#')[0];
  const link = $('#app-link'); link.href = url; link.textContent = url.replace(/^https?:\/\//, '');
  $('.brand-logo').innerHTML = logo('light', 34);
  if (window.QRCode) new QRCode($('#qr'), { text: url, width: 240, height: 240, colorDark: '#073B42', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
}

/* Escenarios de captura (?shot=pasajero|conductor|nuevo): preparan datos de ejemplo para documentar las pantallas */
const SHOT = new URLSearchParams(location.search).get('shot');
if (SHOT) {
  state = defaults();
  if (SHOT !== 'nuevo') {
    state.user = { usuario: 'demo', nombre: 'Laura Martínez', telefono: '3151234567', foto: null, vehiculo: { modelo: 'Renault Sandero', color: 'Gris', placa: 'ABC123' } };
    state.onboarded = true;
    state.reservas = ['k1'];
    pushMsg('c1', 'sys', 'Reservaste el cupo de hoy a las ' + BASE[0].hora);
    pushMsg('c1', 'me', '¿El cupo sigue disponible?');
    pushMsg('c1', 'c1', '¡Hola! Sí, el cupo sigue disponible 🙌');
    pushMsg('c1', 'me', 'Ya voy para el punto de encuentro');
    pushMsg('c1', 'c1', 'Perfecto, te espero en la entrada principal. Llega 5 minutos antes, porfa.');
    state.chats.c1.unread = false;
    const q = new URLSearchParams(location.search).get('q'); if (q) state.filtros.q = q;
    if (SHOT === 'conductor') {
      state.rol = 'conductor';
      state.misCupos = [
        { id: 'm1', conductorId: 'me', origen: 'unal-palmira', destino: 'javeriana', dia: 1, hora: '06:30', total: 3, aporte: 8000, encuentro: 'Portería principal UNAL', pasajeros: ['p1', 'p2'] },
        { id: 'm2', conductorId: 'me', origen: 'javeriana', destino: 'parque-bolivar', dia: 1, hora: '17:45', total: 4, aporte: 8000, encuentro: 'Parqueadero de visitantes', pasajeros: ['p3'] },
      ];
      pushMsg('p1', 'p1', '¡Hola! Acabo de reservar tu cupo de las 06:30. ¿Nos vemos en la portería?');
    }
  }
}

/* Arranque: pantalla de carga y luego la ruta pedida */
initQR();
const destino = location.hash && location.hash !== '#/carga' ? location.hash.slice(1) : null;
$('#app').innerHTML = V.carga();
if (!(SHOT && location.hash === '#/carga')) setTimeout(() => {
  stack.push(destino || '/');
  if (destino) render(); else go(state.user ? '/inicio' : '/bienvenida', true);
  const sel = SHOT && new URLSearchParams(location.search).get('click');
  if (sel) setTimeout(() => document.querySelector(sel)?.click(), 300);
}, SHOT ? 0 : 1400);
