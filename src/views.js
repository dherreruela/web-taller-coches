const TALLER = process.env.TALLER_NOMBRE || "Taller Mecánico";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title, body) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · ${esc(TALLER)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <a class="brand" href="/">
      <img src="/logo.svg" alt="Logo" class="brand-logo" width="34" height="34">
      <span>${esc(TALLER)}</span>
    </a>
    <nav><a href="/">Pedir cita</a> <a href="/admin">Panel</a></nav>
  </header>
  <main>${body}</main>
  <footer>© ${new Date().getFullYear()} ${esc(TALLER)}</footer>
</body>
</html>`;
}

export function bookingPage({ error, values = {} } = {}) {
  const v = (k) => esc(values[k] || "");
  return layout(
    "Pedir cita",
    `<h1>Reserva tu cita</h1>
    <p class="lead">Rellena el formulario y te confirmaremos la cita lo antes posible.</p>
    ${error ? `<p class="alert">${esc(error)}</p>` : ""}
    <form method="post" action="/citas" class="card">
      <label>Nombre y apellidos*
        <input name="name" required value="${v("name")}">
      </label>
      <label>Teléfono*
        <input name="phone" required value="${v("phone")}">
      </label>
      <label>Email
        <input type="email" name="email" value="${v("email")}">
      </label>
      <label>Vehículo* (marca, modelo, matrícula)
        <input name="vehicle" required value="${v("vehicle")}">
      </label>
      <label>Servicio*
        <select name="service" required>
          ${["Revisión general", "Cambio de aceite", "Neumáticos", "Frenos", "Diagnóstico avería", "Pre-ITV", "Otro"]
            .map((s) => `<option${values.service === s ? " selected" : ""}>${s}</option>`)
            .join("")}
        </select>
      </label>
      <label>Fecha y hora preferida*
        <input type="datetime-local" name="preferred_at" required value="${v("preferred_at")}">
      </label>
      <label>Comentarios
        <textarea name="notes" rows="3">${v("notes")}</textarea>
      </label>
      <button type="submit">Solicitar cita</button>
    </form>`
  );
}

export function confirmationPage() {
  return layout(
    "Cita solicitada",
    `<h1>¡Cita solicitada! ✅</h1>
    <p class="lead">Hemos recibido tu solicitud. Nos pondremos en contacto contigo para confirmarla.</p>
    <p><a class="button" href="/">Volver</a></p>`
  );
}

export function loginPage({ error, hint } = {}) {
  return layout(
    "Acceder al panel",
    `<h1>Acceso al panel</h1>
    ${error ? `<p class="alert">${esc(error)}</p>` : ""}
    ${
      hint
        ? `<p class="hint">Datos de acceso — Usuario: <strong>${esc(hint.user)}</strong> ·
           Contraseña: <strong>${esc(hint.password)}</strong></p>`
        : ""
    }
    <form method="post" action="/admin/login" class="card">
      <label>Usuario
        <input name="user" autofocus required value="${hint ? esc(hint.user) : ""}">
      </label>
      <label>Contraseña
        <input type="password" name="password" required value="${hint ? esc(hint.password) : ""}">
      </label>
      <button type="submit">Entrar</button>
    </form>`
  );
}

const STATUSES = ["pendiente", "confirmada", "completada", "cancelada"];

export function adminPage(appointments) {
  const rows = appointments
    .map(
      (a) => `<tr class="s-${esc(a.status)}">
      <td>${esc(a.preferred_at?.replace("T", " "))}</td>
      <td>${esc(a.name)}<br><small>${esc(a.phone)}${a.email ? " · " + esc(a.email) : ""}</small></td>
      <td>${esc(a.vehicle)}</td>
      <td>${esc(a.service)}${a.notes ? `<br><small>${esc(a.notes)}</small>` : ""}</td>
      <td>
        <form method="post" action="/admin/${a.id}/status" class="inline">
          <select name="status" onchange="this.form.submit()">
            ${STATUSES.map((s) => `<option${a.status === s ? " selected" : ""}>${s}</option>`).join("")}
          </select>
        </form>
      </td>
      <td>
        <form method="post" action="/admin/${a.id}/delete" class="inline"
              onsubmit="return confirm('¿Eliminar esta cita?')">
          <button class="link-danger">Eliminar</button>
        </form>
      </td>
    </tr>`
    )
    .join("");

  return layout(
    "Panel",
    `<div class="row-between">
      <h1>Citas (${appointments.length})</h1>
      <form method="post" action="/admin/logout" class="inline"><button class="link-danger">Salir</button></form>
    </div>
    ${
      appointments.length
        ? `<div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Vehículo</th><th>Servicio</th><th>Estado</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`
        : "<p>No hay citas todavía.</p>"
    }`
  );
}

export function errorPage(message) {
  return layout("Error", `<h1>Algo ha ido mal</h1><p class="alert">${esc(message)}</p>`);
}
