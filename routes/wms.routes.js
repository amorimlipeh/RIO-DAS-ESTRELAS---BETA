import express from 'express';
import { listarProdutos } from '../modules/produtos.js';

const router = express.Router();

router.get('/mapa', (_req, res) => {
  const produtos = listarProdutos().filter((p) => p.endereco);
  const mapa = {};
  for (const p of produtos) {
    const [rua = '00', numero = '000', andar = '1', posicao = '1'] = String(p.endereco).split('-');
    mapa[rua] ||= {};
    mapa[rua][numero] ||= [];
    mapa[rua][numero].push({
      codigo: p.codigo,
      nome: p.nome,
      andar,
      posicao,
      quantidade: p.quantidade || 0,
      endereco: p.endereco
    });
  }
  res.json(mapa);
});

export default router;
