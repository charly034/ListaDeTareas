// ==============================
//  Modelos
// ==============================
class Usuario {
  constructor(username, password, admin = false) {
    this.username = username;
    this.password = password;
    this.admin = admin;
  }
}

class Sesion {
  constructor(usuario) {
    this.usuario = usuario;
    this.iniciada = false;
  }
  iniciar() {
    this.iniciada = true;
  }
  cerrar() {
    this.iniciada = false;
  }
}

class Tarea {
  constructor(nombre, usuario, estado = "pendiente", id = genId()) {
    this.id = id; // id único para manipular tareas filtradas/ordenadas
    this.nombre = nombre;
    this.estado = estado; // "pendiente" | "completada"
    this.usuario = usuario; // username del dueño
  }
  toggle() {
    this.estado = this.estado === "pendiente" ? "completada" : "pendiente";
  }
}

// ==============================
//  Estado y claves de storage
// ==============================
let usuarios = [];
let tareas = [];
let sesion = null;

const KEY_TAREAS = "tareas-lista-v2";
const KEY_SESSION = "sesion-usuario";

// ==============================
/** Util: id único (fallback si no hay crypto.randomUUID) */
function genId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ==============================
//  Carga de usuarios (async)
// ==============================
async function cargarUsuarios() {
  const resp = await fetch("usuarios.json");
  const data = await resp.json();
  usuarios = data.map((u) => new Usuario(u.username, u.password, u.admin));
  // console.log("Usuarios cargados:", usuarios);
}

// ==============================
//  Persistencia de tareas
// ==============================
function guardarEnLocalStorage() {
  const plain = tareas.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    estado: t.estado,
    usuario: t.usuario,
  }));
  localStorage.setItem(KEY_TAREAS, JSON.stringify(plain));
}

function cargarDesdeLocalStorage() {
  const datos = localStorage.getItem(KEY_TAREAS);
  if (!datos) return;
  const arr = JSON.parse(datos);
  tareas = arr.map((o) => new Tarea(o.nombre, o.usuario, o.estado, o.id));
}

// ==============================
//  Helpers de sesión / filtrado
// ==============================
function getUsuarioActual() {
  return sesion?.usuario?.username || null;
}

function getTareasDeSesion() {
  const u = getUsuarioActual();
  if (!u) return [];
  if (sesion.usuario.admin === true) return tareas; // admin ve todo
  return tareas.filter((t) => t.usuario === u);
}

// ==============================
//  DOM
// ==============================
const formulario = document.getElementById("formulario");
const tareaInput = document.getElementById("tarea");
const tareasContainer = document.getElementById("tareas");

// Secciones para mostrar/ocultar
const iniciosesion = document.getElementById("sesion");
const bloquePrincipal = document.getElementById("BloquePrincipal");
const btnCierre = document.getElementById("cierre");
const AsignarUsuario = document.getElementById("AsignarUsuario");

// Inputs login
const inputUser = document.getElementById("usuario");
const inputPass = document.getElementById("clave");

// ==============================
//  Login / Logout
// ==============================
function mostrarUIAutenticado() {
  if (iniciosesion) iniciosesion.style.display = "none";
  if (bloquePrincipal) bloquePrincipal.style.display = "block";
  if (btnCierre) btnCierre.style.display = "block";
  if (sesion.usuario.admin === true) {
    AsignarUsuario.style.display = "block";
    usuarios.forEach((u) => {
      const option = document.createElement("option");
      option.value = u.username;
      option.textContent = u.username;
      AsignarUsuario.appendChild(option);
    });
  }
}

function mostrarUINoAutenticado() {
  if (iniciosesion) iniciosesion.style.display = "block";
  if (bloquePrincipal) bloquePrincipal.style.display = "none";
  if (btnCierre) btnCierre.style.display = "none";
}

function postLoginInit() {
  // Persisto la sesión y muestro UI
  localStorage.setItem(KEY_SESSION, sesion.usuario.username);
  mostrarUIAutenticado();
  // Render inicial para el usuario actual
  mostrarTareas();
}

function iniciarsesion() {
  const username = inputUser?.value?.trim() || "";
  const password = inputPass?.value || "";

  const usuario = usuarios.find(
    (u) => u.username === username && u.password === password
  );

  if (usuario) {
    sesion = new Sesion(usuario);
    sesion.iniciar();
    Swal.fire({
      title: "Bienvenido",
      text: "Has iniciado sesión correctamente.",
      icon: "success",
    });
    // console.log("Inicio de sesión exitoso");
    postLoginInit();
    console.log(`Sesión iniciada como ${usuario.admin}`);
    if (sesion.usuario.admin === true) {
      console.log(" (administrador)");
    }
    console.log(usuarios);
  } else {
    // console.log("Credenciales inválidas");
    Swal.fire({
      title: "Error",
      text: "Nombre de usuario o contraseña incorrectos.",
      icon: "error",
    });
  }
}

function cerrarSesion() {
  if (!sesion) return;
  sesion.cerrar();
  sesion = null;
  localStorage.removeItem(KEY_SESSION);
  mostrarUINoAutenticado();
  AsignarUsuario.style.display = "none";
  tareasContainer.innerHTML = ""; // limpiar vista
}

// ==============================
//  Alta / edición / borrado
// ==============================
if (formulario) {
  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = tareaInput.value.trim();
    let usuarioTarea = sesion.usuario.username;
    if (!nombre || !sesion) return;
    if (AsignarUsuario.value === "" && sesion.usuario.admin === true) {
      Swal.fire({
        title: "Error",
        text: "Por favor, seleccione un usuario para asignar la tarea.",
        icon: "error",
      });
      return;
    }
    // ✅ asociar tarea al usuario logueado
    if (sesion.usuario.admin === true) {
      usuarioTarea = AsignarUsuario.value;
      console.log("Tarea asignada a:", usuarioTarea);
    }
    const t = new Tarea(nombre, usuarioTarea);
    tareas.push(t);
    guardarEnLocalStorage();
    formulario.reset();
    mostrarTareas();
  });
}

if (tareasContainer) {
  tareasContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    const idx = tareas.findIndex((t) => t.id === id);
    if (idx === -1) return;

    if (btn.classList.contains("completar")) {
      Swal.fire({
        title:
          tareas[idx].estado === "pendiente"
            ? "¿Completar tarea?"
            : "¿Deshacer tarea?",
        icon: "question",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title:
              tareas[idx].estado === "pendiente" ? "Completada" : "Deshecha",
            text:
              tareas[idx].estado === "pendiente"
                ? "La tarea se marcará como completada."
                : "La tarea se marcará como pendiente.",
          });
          tareas[idx].toggle();
          guardarEnLocalStorage();
          mostrarTareas();
        }
      });
    }
    if (btn.classList.contains("eliminar")) {
      Swal.fire({
        title: "¿Eliminar tarea?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          tareas.splice(idx, 1);
          guardarEnLocalStorage();
          mostrarTareas();

          Swal.fire({
            title: "Eliminada",
            text: "La tarea ha sido eliminada.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      });
    }
  });
}

// ==============================
//  Filtros (botones con clase .filtro)
// ==============================
document.querySelectorAll(".filtro").forEach((boton) => {
  boton.addEventListener("click", () => {
    const filtro = boton.dataset.filtro;
    const base = getTareasDeSesion();

    let lista = [];
    if (filtro === "todas") {
      lista = base;
    } else if (filtro === "alfabetica") {
      lista = [...base].sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else {
      // "pendiente" | "completada"
      lista = base.filter((t) => t.estado === filtro);
    }
    mostrarTareas(lista);
  });
});

// ==============================
//  Render
// ==============================
function mostrarTareas(listado = getTareasDeSesion()) {
  if (!tareasContainer) return;
  tareasContainer.innerHTML = "";

  if (!sesion) {
    tareasContainer.textContent = "Inicia sesión para ver tus tareas.";
    return;
  }

  if (listado.length === 0) {
    tareasContainer.textContent = "No hay tareas aún.";
    return;
  }

  listado.forEach((t) => {
    const div = document.createElement("div");
    div.className = "tarea";
    div.innerHTML = `
      <span class="${
        t.estado === "completar" || t.estado === "completada"
          ? "completada"
          : ""
      }">
        <strong>Tarea:</strong> ${t.nombre}
      </span>
      <span class="usuario"><strong>Ejecutada por:</strong> ${t.usuario}</span>
      <button class="completar" data-id="${t.id}">
        ${t.estado === "pendiente" ? "Completar" : "Deshacer"}
      </button>
      <button class="eliminar" style="${
        sesion.usuario.admin === true ? "" : "display: none;"
      }" data-id="${t.id}">Eliminar</button>
    `;
    tareasContainer.appendChild(div);
  });
}

// ==============================
//  Boot: cargar datos y reanudar sesión
// ==============================
(async function init() {
  await cargarUsuarios(); // 👍 esperamos usuarios antes de loguear
  cargarDesdeLocalStorage(); // carga todas las tareas (de todos los usuarios)

  // Reanudar sesión si existía
  const lastUser = localStorage.getItem(KEY_SESSION);
  if (lastUser) {
    const usuario = usuarios.find((u) => u.username === lastUser);
    if (usuario) {
      sesion = new Sesion(usuario);
      sesion.iniciar();
      mostrarUIAutenticado();
      mostrarTareas();
      return;
    } else {
      localStorage.removeItem(KEY_SESSION);
    }
  }
  mostrarUINoAutenticado();
})();
