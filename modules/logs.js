import { readJson, writeJson, generateId } from "./db.js";

const file = "logs.json";

function nowIso() {
  return new Date().toISOString();
}

function normalizeLog(entry = {}) {
  const modulo = entry.modulo || entry.tipo || "sistema";
  const acao = entry.acao || entry.evento || "evento";
  const descricao = entry.descricao || entry.mensagem || entry.detalhe || acao;
  return {
    id: entry.id || generateId("LOG"),
    dataHora: entry.dataHora || entry.data || nowIso(),
    usuario: entry.usuario || "sistema",
    acao,
    modulo,
    descricao
  };
}

export function addLog(entry = {}) {
  const logs = readJson(file, []);
  const item = normalizeLog(entry);
  logs.unshift(item);
  writeJson(file, logs.slice(0, 1000));
  return item;
}

export function listLogs() {
  const logs = readJson(file, []);
  const normalized = logs.map((item) => normalizeLog(item));
  writeJson(file, normalized.slice(0, 1000));
  return normalized;
}
