import { readJson, writeJson, generateId } from "./db.js";
import { addLog } from "./logs.js";
import { criarNotificacao } from "./notificacoes.js";
import { getConfig } from "./config.js";
import { verificarEstoqueBaixo } from "./produtos.js";

const file = "estoque.json";

export function listarEstoque() {
  return readJson(file, []);
}

export function saldoPorProduto(codigo) {
  return listarEstoque().filter((x) => x.produtoCodigo === codigo).reduce((s, x) => s + Number(x.quantidade || 0), 0);
}

export function movimentar(payload) {
  const rows = listarEstoque();
  const config = getConfig();
  const quantidade = Number(payload.quantidade || 0);
  const tipo = payload.tipo || "entrada";
  const sinal = tipo === "saida" ? -1 : 1;
  const valor = quantidade * sinal;

  if (tipo === "saida") {
    const saldoAtual = saldoPorProduto(payload.produtoCodigo);
    if (saldoAtual + valor < 0 && config.modos.estoqueNegativo !== "sempre") {
      throw new Error("Saída bloqueada por saldo insuficiente.");
    }
  }

  const item = {
    id: generateId("MOV"),
    produtoCodigo: payload.produtoCodigo,
    endereco: payload.endereco || "",
    tipo,
    quantidade: valor,
    usuario: payload.usuario || "sistema",
    motivo: payload.motivo || "",
    dataHora: new Date().toISOString()
  };
  rows.unshift(item);
  writeJson(file, rows);
  addLog({ modulo: "estoque", acao: tipo, descricao: `${tipo} de ${quantidade} no produto ${payload.produtoCodigo}.` });
  verificarEstoqueBaixo(rows);
  return item;
}

export function resumoEstoque() {
  const rows = listarEstoque();
  const porProduto = {};
  rows.forEach((r) => {
    porProduto[r.produtoCodigo] = (porProduto[r.produtoCodigo] || 0) + Number(r.quantidade || 0);
  });
  return porProduto;
}

export function registrarDivergencia(produtoCodigo, sistema, contado) {
  const dif = Number(contado) - Number(sistema);
  const not = criarNotificacao({
    prioridade: "alta",
    mensagem: `Divergência de inventário no produto ${produtoCodigo}: sistema ${sistema}, contado ${contado}.`,
    origem: "inventario",
    extras: { produtoCodigo, sistema, contado, diferenca: dif }
  });
  return { diferenca: dif, notificacao: not };
}
