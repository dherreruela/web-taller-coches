import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import {
  createAppointment,
  listAppointments,
  updateStatus,
  deleteAppointment,
} from "./db.js";
import {
  bookingPage,
  confirmationPage,
  adminPage,
  loginPage,
  errorPage,
} from "./views.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cambia-esta-clave";
const VALID_STATUSES = new Set(["pendiente", "confirmada", "completada", "cancelada"]);
// Muestra usuario y contraseña en la pantalla de login (útil para enseñar la
// demo a un cliente). Ponlo en "false" o quita la variable en producción.
const LOGIN_HINT = process.env.LOGIN_HINT === "true";

// Token de sesión sin estado: HMAC del usuario+contraseña.
// Si cambia la contraseña, las cookies antiguas dejan de valer.
const SESSION_SECRET = process.env.SESSION_SECRET || ADMIN_PASSWORD;
const SESSION_TOKEN = crypto
  .createHmac("sha256", SESSION_SECRET)
  .update(`${ADMIN_USER}:${ADMIN_PASSWORD}`)
  .digest("hex");
const COOKIE_NAME = "taller_admin";

const app = express();
app.disable("x-powered-by");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "public")));

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );
}

function credentialsOk(user, pass) {
  return user === ADMIN_USER && pass === ADMIN_PASSWORD;
}

// --- Salud (health check) ---
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- Público: formulario de cita ---
app.get("/", (_req, res) => {
  res.send(bookingPage());
});

app.post("/citas", (req, res) => {
  const { name, phone, vehicle, service, preferred_at } = req.body;
  const required = { name, phone, vehicle, service, preferred_at };
  const missing = Object.entries(required).filter(([, val]) => !val || !String(val).trim());

  if (missing.length) {
    return res.status(400).send(
      bookingPage({
        error: "Faltan campos obligatorios: " + missing.map(([k]) => k).join(", "),
        values: req.body,
      })
    );
  }

  try {
    createAppointment(req.body);
    res.status(201).send(confirmationPage());
  } catch (err) {
    console.error("Error al crear cita:", err);
    res.status(500).send(errorPage("No se ha podido guardar la cita. Inténtalo de nuevo."));
  }
});

// --- Autenticación del panel: cookie de sesión o Basic Auth ---
function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME] === SESSION_TOKEN) return next();

  const [scheme, encoded] = (req.headers.authorization || "").split(" ");
  if (scheme === "Basic" && encoded) {
    const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");
    if (credentialsOk(user, pass)) return next();
  }

  return res.redirect("/admin/login");
}

app.get("/admin/login", (req, res) => {
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME] === SESSION_TOKEN) return res.redirect("/admin");
  res.send(
    loginPage({
      error: req.query.error ? "Usuario o contraseña incorrectos" : null,
      hint: LOGIN_HINT ? { user: ADMIN_USER, password: ADMIN_PASSWORD } : null,
    })
  );
});

app.post("/admin/login", (req, res) => {
  if (credentialsOk(req.body.user, req.body.password)) {
    res.cookie(COOKIE_NAME, SESSION_TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.protocol === "https",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect("/admin");
  }
  res.redirect("/admin/login?error=1");
});

app.post("/admin/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect("/admin/login");
});

app.get("/admin", requireAuth, (_req, res) => {
  res.send(adminPage(listAppointments()));
});

app.post("/admin/:id/status", requireAuth, (req, res) => {
  const status = String(req.body.status || "");
  if (VALID_STATUSES.has(status)) {
    updateStatus(Number(req.params.id), status);
  }
  res.redirect("/admin");
});

app.post("/admin/:id/delete", requireAuth, (req, res) => {
  deleteAppointment(Number(req.params.id));
  res.redirect("/admin");
});

app.use((_req, res) => res.status(404).send(errorPage("Página no encontrada")));

app.listen(PORT, () => {
  console.log(`Taller escuchando en http://localhost:${PORT}`);
});
