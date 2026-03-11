import { readJson, writeJson, generateId } from "./db.js";

const file = "notificacoes.json";

export function criarNotificacao(payload) {
  const rows = readJson(file, []);
  const item = {
    id: generateId("NOT"),
    tipo: payload.tipo || "alerta",
    prioridade: payload.prioridade || "media",
    mensagem: payload.mensagem || "",
    usuario: payload.usuario || "todos",
    status: payload.status || "nova",
    dataHora: new Date().toISOString(),
    origem: payload.origem || "sistema",
    extras: payload.extras || {}
  };
  rows.unshift(item);
  writeJson(file, rows.slice(0, 1000));
  return item;
}

export function listarNotificacoes() {
  return readJson(file, []);
}

export function atualizarNotificacao(id, payload) {
  const rows = readJson(file, []);
  const idx = rows.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...payload };
  writeJson(file, rows);
  return rows[idx];
}
