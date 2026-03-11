import { readJson, writeJson } from "./db.js";

const file = "configuracoes.json";

const defaults = {
  nomeSistema: "SISTEMA DE ESTOQUE ✨ RIO DAS ESTRELAS 🌟",
  modos: {
    estoqueNegativo: "permissao",
    reservaPedido: "automatica_inicio_separacao",
    enderecamentoRecebimento: "misto",
    importacao: "misto",
    inventario: "misto",
    backup: "manual_automatico"
  },
  estoqueMinimoPadrao: 5,
  ruasBloqueadas: ["01", "02", "03"]
};

export function getConfig() {
  const atual = readJson(file, defaults);
  return { ...defaults, ...atual, modos: { ...defaults.modos, ...(atual.modos || {}) } };
}

export function updateConfig(payload) {
  const next = { ...getConfig(), ...payload, modos: { ...getConfig().modos, ...((payload || {}).modos || {}) } };
  return writeJson(file, next);
}
