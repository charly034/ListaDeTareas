# 🧩 Lista de Tareas Grupales

Aplicación web sencilla para **gestionar tareas por usuario**, con roles de **usuario común** y **administrador**, hecha en HTML, CSS y JavaScript puro.  
Permite iniciar sesión, agregar, completar, eliminar y filtrar tareas.  
El administrador puede asignar tareas a otros usuarios.

---

## 🚀 Características principales

- 🔐 **Inicio de sesión por usuario**  
  Los datos se cargan desde `usuarios.json`.  
  Cada usuario tiene su propio conjunto de tareas.

- 👑 **Rol de administrador**  
  El usuario con `admin: true` (por defecto “bruno”) puede:

  - Ver **todas las tareas** del sistema.
  - Asignar tareas a otros usuarios mediante un `<select>`.
  - Eliminar cualquier tarea.

- ✅ **Gestión de tareas**

  - Crear nuevas tareas.
  - Marcar como **completadas** o **pendientes** (con confirmación).
  - Eliminar tareas (confirmación con SweetAlert2).
  - Filtrar por estado o alfabéticamente.

- 💾 **Persistencia local**  
  Las tareas y la sesión iniciada se guardan en `localStorage`, por lo que permanecen al recargar la página.

- 🎨 **Interfaz moderna y responsive**  
  Estilos cuidados con un diseño claro y adaptable a móviles.

---
