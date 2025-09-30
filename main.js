//  Modelo
class Tarea {
  constructor(nombre, estado = "pendiente") {
    this.nombre = nombre;
    this.estado = estado; // "pendiente" | "completada"
  }
  toggle() {
    this.estado = this.estado === "pendiente" ? "completada" : "pendiente";
  }
}

//  Estado
const tareas = [];
const key = "tareas-lista";

//  Persistencia
function guardarEnLocalStorage() {
  const plain = tareas.map((t) => ({ nombre: t.nombre, estado: t.estado }));
  localStorage.setItem(key, JSON.stringify(plain));
}

function cargarDesdeLocalStorage() {
  const datos = localStorage.getItem(key);
  if (!datos) return;
  const arr = JSON.parse(datos);
  arr.forEach((obj) => tareas.push(new Tarea(obj.nombre, obj.estado)));
}

// DOM
const formulario = document.getElementById("formulario");
const tareaInput = document.getElementById("tarea");
const tareasContainer = document.getElementById("tareas");

//  Agregar
formulario.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = tareaInput.value.trim();
  if (!nombre) return;

  tareas.push(new Tarea(nombre));
  guardarEnLocalStorage(); // 👈 guardar
  formulario.reset();
  mostrarTareas();
});

//  (Completar / Eliminar)
tareasContainer.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const index = Number(btn.dataset.index);

  if (btn.classList.contains("completar")) {
    tareas[index].toggle();
    guardarEnLocalStorage(); // 👈 guardar
    mostrarTareas();
  }
  if (btn.classList.contains("eliminar")) {
    tareas.splice(index, 1);
    guardarEnLocalStorage(); // 👈 guardar
    mostrarTareas();
  }
});
//Filtrado
document.querySelectorAll(".filtro").forEach((boton) => {
  boton.addEventListener("click", () => {
    const filtro = boton.dataset.filtro;
    let tareasFiltradas = [];
    if (filtro === "todas") {
      tareasFiltradas = tareas;
    } else if (filtro === "alfabetica") {
      const tareasOrdenadas = [...tareas];
      tareasFiltradas = tareasOrdenadas.sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
    } else {
      tareasFiltradas = tareas.filter((tarea) => tarea.estado === filtro);
    }
    mostrarTareas(tareasFiltradas);
  });
});

//  Render
function mostrarTareas(ListadoDeTareas = tareas) {
  tareasContainer.innerHTML = "";
  if (ListadoDeTareas.length === 0) {
    tareasContainer.textContent = "No hay tareas aún.";
    return;
  }
  ListadoDeTareas.forEach((tarea, index) => {
    const div = document.createElement("div");
    div.className = "tarea";
    div.innerHTML = `
      <span class="${tarea.estado === "completada" ? "completada" : ""}">
        ${tarea.nombre}
      </span>
      <button class="completar" data-index="${index}">
        ${tarea.estado === "pendiente" ? "Completar" : "Deshacer"}
      </button>
      <button class="eliminar" data-index="${index}">Eliminar</button>
    `;
    tareasContainer.appendChild(div);
  });
}

//  Inicio
cargarDesdeLocalStorage();
mostrarTareas(tareas);
