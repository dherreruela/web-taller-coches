import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

// La ruta del fichero SQLite es configurable para poder montar un volumen
// persistente en Dokploy (p. ej. DB_PATH=/data/taller.db).
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "taller.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    name         TEXT NOT NULL,
    phone        TEXT NOT NULL,
    email        TEXT,
    vehicle      TEXT NOT NULL,
    service      TEXT NOT NULL,
    preferred_at TEXT NOT NULL,
    notes        TEXT,
    status       TEXT NOT NULL DEFAULT 'pendiente'
  );
`);

const statements = {
  insert: db.prepare(`
    INSERT INTO appointments (name, phone, email, vehicle, service, preferred_at, notes)
    VALUES (@name, @phone, @email, @vehicle, @service, @preferred_at, @notes)
  `),
  listAll: db.prepare(`SELECT * FROM appointments ORDER BY preferred_at DESC`),
  setStatus: db.prepare(`UPDATE appointments SET status = ? WHERE id = ?`),
  remove: db.prepare(`DELETE FROM appointments WHERE id = ?`),
};

export function createAppointment(data) {
  const info = statements.insert.run({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    vehicle: data.vehicle,
    service: data.service,
    preferred_at: data.preferred_at,
    notes: data.notes || null,
  });
  return info.lastInsertRowid;
}

export function listAppointments() {
  return statements.listAll.all();
}

export function updateStatus(id, status) {
  statements.setStatus.run(status, id);
}

export function deleteAppointment(id) {
  statements.remove.run(id);
}

export default db;
