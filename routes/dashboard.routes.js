import express from 'express';
import { listarProdutos } from '../modules/produtos.js';
import { resumoEstoque } from '../modules/estoque.js';
import { listarPedidos } from '../modules/pedidos.js';
import { listLogs } from '../modules/logs.js';

const router = express.Router();

router.get('/', (_req, res) => {
  const produtos = listarProdutos();
  const resumo = resumoEstoque();
  const pedidos = listarPedidos();
  const totalEstoque = Object.values(resumo).reduce((s, v) => s + Number(v || 0), 0);
  res.json({
    produtos: produtos.length,
    totalEstoque,
    pedidos: pedidos.length,
    logsRecentes: listLogs().slice(0, 10)
  });
});

export default router;
