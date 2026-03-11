import { readJson, writeJson, generateId } from "./db.js";
import { addLog } from "./logs.js";
import { criarNotificacao } from "./notificacoes.js";

const file = "pedidos.json";

export function listarPedidos() {
  return readJson(file, []);
}

export function criarPedido(payload) {
  const rows = listarPedidos();
  const item = {
    id: generateId("PED"),
    numero: payload.numero || String(Date.now()).slice(-6),
    cliente: payload.cliente || "",
    status: "novo",
    reservaModo: payload.reservaModo || "automatica_inicio_separacao",
    itens: payload.itens || [],
    criadoEm: new Date().toISOString()
  };
  rows.unshift(item);
  writeJson(file, rows);
  addLog({ modulo: "pedidos", acao: "criar", descricao: `Pedido ${item.numero} criado.` });
  criarNotificacao({ prioridade: "media", mensagem: `Pedido ${item.numero} criado.`, origem: "pedidos" });
  return item;
}

export function atualizarPedido(id, payload) {
  const rows = listarPedidos();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...payload, atualizadoEm: new Date().toISOString() };
  writeJson(file, rows);
  addLog({ modulo: "pedidos", acao: "editar", descricao: `Pedido ${rows[idx].numero} atualizado.` });
  return rows[idx];
}

export function registrarNaoEmbarcado(id, payload) {
  const rows = listarPedidos();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const item = {
    produtoCodigo: payload.produtoCodigo,
    quantidadePrevista: Number(payload.quantidadePrevista || 0),
    quantidadeEmbarcada: Number(payload.quantidadeEmbarcada || 0),
    quantidadeNaoEmbarcada: Number(payload.quantidadeNaoEmbarcada || 0),
    motivo: payload.motivo || "pendente para próximo caminhão",
    usuario: payload.usuario || "sistema",
    dataHora: new Date().toISOString()
  };
  rows[idx].naoEmbarcados = rows[idx].naoEmbarcados || [];
  rows[idx].naoEmbarcados.unshift(item);
  rows[idx].status = item.quantidadeEmbarcada > 0 ? "embarcado_parcial" : "nao_embarcado";
  writeJson(file, rows);
  criarNotificacao({
    prioridade: "alta",
    mensagem: `Produto ${item.produtoCodigo} não foi no caminhão do pedido ${rows[idx].numero}.`,
    origem: "expedicao",
    extras: item
  });
  addLog({ modulo: "expedicao", acao: "nao_embarcado", descricao: `Pedido ${rows[idx].numero} com item não embarcado ${item.produtoCodigo}.` });
  return rows[idx];
}
