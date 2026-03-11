import { readJson, writeJson, generateId } from "./db.js";
import { addLog } from "./logs.js";
import { criarNotificacao } from "./notificacoes.js";
import { getConfig } from "./config.js";

const file = "produtos.json";

export function listarProdutos() {
  return readJson(file, []);
}

export function buscarProdutos(q = "") {
  const produtos = listarProdutos();
  const termo = String(q || "").trim().toLowerCase();
  if (!termo) return produtos;
  if (termo.includes("%")) {
    const parts = termo.split("%").filter(Boolean);
    return produtos.filter((p) => parts.every((part) => `${p.codigo} ${p.nome} ${p.material || ""}`.toLowerCase().includes(part)));
  }
  return produtos.filter((p) => `${p.codigo} ${p.nome} ${p.material || ""}`.toLowerCase().includes(termo));
}

export function criarProduto(payload) {
  const rows = listarProdutos();
  if (rows.some((p) => p.codigo === payload.codigo)) {
    throw new Error("Já existe um produto com este código.");
  }
  const item = {
    id: generateId("PRO"),
    codigo: payload.codigo,
    nome: payload.nome,
    material: payload.material || "",
    categoria: payload.categoria || "",
    unidade: payload.unidade || "UN",
    codigoBarras: payload.codigoBarras || "",
    imagem: payload.imagem || "",
    estoqueMinimo: Number(payload.estoqueMinimo ?? getConfig().estoqueMinimoPadrao),
    observacao: payload.observacao || "",
    status: payload.status || "ativo",
    criadoEm: new Date().toISOString()
  };
  rows.unshift(item);
  writeJson(file, rows);
  addLog({ modulo: "produtos", acao: "criar", descricao: `Produto ${item.codigo} criado.` });
  return item;
}

export function atualizarProduto(id, payload) {
  const rows = listarProdutos();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...payload, atualizadoEm: new Date().toISOString() };
  writeJson(file, rows);
  addLog({ modulo: "produtos", acao: "editar", descricao: `Produto ${rows[idx].codigo} atualizado.` });
  return rows[idx];
}

export function removerProduto(id) {
  const rows = listarProdutos();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const [removed] = rows.splice(idx, 1);
  writeJson(file, rows);
  addLog({ modulo: "produtos", acao: "remover", descricao: `Produto ${removed.codigo} removido.` });
  return removed;
}

export function verificarEstoqueBaixo(estoques = []) {
  const produtos = listarProdutos();
  produtos.forEach((produto) => {
    const saldo = estoques.filter((e) => e.produtoCodigo === produto.codigo).reduce((s, e) => s + Number(e.quantidade || 0), 0);
    if (saldo <= Number(produto.estoqueMinimo || 0)) {
      criarNotificacao({
        prioridade: saldo === 0 ? "alta" : "media",
        mensagem: `Produto ${produto.codigo} com estoque ${saldo === 0 ? "zerado" : "baixo"}.`,
        origem: "estoque",
        extras: { produtoCodigo: produto.codigo, saldo }
      });
    }
  });
}
