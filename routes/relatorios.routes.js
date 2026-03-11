import express from "express";
import { listarProdutos } from "../modules/produtos.js";
import { listarEstoque, resumoEstoque } from "../modules/estoque.js";
import { listarPedidos } from "../modules/pedidos.js";
import { listarEnderecos } from "../modules/enderecos.js";
import { listLogs } from "../modules/logs.js";

const router = express.Router();

router.get("/dashboard", (_req, res) => {
  const produtos = listarProdutos();
  const estoque = listarEstoque();
  const pedidos = listarPedidos();
  const enderecos = listarEnderecos();
  const resumo = resumoEstoque();

  const totalUnidades = Object.values(resumo).reduce((s, v) => s + Number(v || 0), 0);
  const ocupados = enderecos.filter((e) => Number(e.quantidade || 0) > 0 || e.status === "ocupado").length;
  const ocupacao = enderecos.length ? Math.round((ocupados / enderecos.length) * 100) : 0;

  res.json({
    produtosCadastrados: produtos.length,
    estoqueTotal: totalUnidades,
    pedidosSeparacao: pedidos.filter((p) => ["novo", "separando", "conferindo"].includes(p.status)).length,
    recebimentosPendentes: 0,
    ocupacaoArmazem: ocupacao,
    ultimosLogs: listLogs().slice(0, 10)
  });
});

export default router;
