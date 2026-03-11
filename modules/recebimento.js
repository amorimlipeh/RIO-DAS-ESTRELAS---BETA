import { readJson, writeJson, generateId } from "./db.js";
import { addLog } from "./logs.js";
import { criarNotificacao } from "./notificacoes.js";

const file = "recebimento.json";

export function listarRecebimentos() {
  return readJson(file, []);
}

export function criarRecebimento(payload) {
  const rows = listarRecebimentos();
  const item = {
    id: generateId("REC"),
    documento: payload.documento || "",
    fornecedor: payload.fornecedor || "",
    modoEndereco: payload.modoEndereco || "misto",
    itens: payload.itens || [],
    status: "pendente",
    criadoEm: new Date().toISOString()
  };
  rows.unshift(item);
  writeJson(file, rows);
  addLog({ modulo: "recebimento", acao: "criar", descricao: `Recebimento ${item.id} criado.` });
  if ((item.itens || []).length) {
    criarNotificacao({ prioridade: "media", mensagem: `Recebimento ${item.id} aguardando conferência.`, origem: "recebimento" });
  }
  return item;
}
