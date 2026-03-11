import { readJson, writeJson, generateId } from "./db.js";
import { addLog } from "./logs.js";

const file = "inventarios.json";

export function listarInventarios() {
  return readJson(file, []);
}

export function criarInventario(payload) {
  const rows = listarInventarios();
  const item = {
    id: generateId("INV"),
    tipo: payload.tipo || "rua",
    rua: payload.rua || "",
    produtoCodigo: payload.produtoCodigo || "",
    endereco: payload.endereco || "",
    status: "aberto",
    responsavel: payload.responsavel || "",
    criadoEm: new Date().toISOString(),
    contagens: payload.contagens || []
  };
  rows.unshift(item);
  writeJson(file, rows);
  addLog({ modulo: "inventario", acao: "criar", descricao: `Inventário ${item.id} criado.` });
  return item;
}
