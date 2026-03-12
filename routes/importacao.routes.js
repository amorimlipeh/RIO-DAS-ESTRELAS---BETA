import express from 'express';
import { criarProduto } from '../modules/produtos.js';

const router = express.Router();

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const itens = Array.isArray(body.itens) ? body.itens : [];
    if (!itens.length) {
      return res.status(400).json({ ok: false, message: 'Envie um JSON com a chave itens para importação. Upload de arquivo não foi implementado nesta versão.' });
    }
    let inseridos = 0;
    const erros = [];
    for (const item of itens) {
      try {
        criarProduto(item);
        inseridos += 1;
      } catch (error) {
        erros.push({ codigo: item.codigo || '', erro: error.message });
      }
    }
    res.json({ ok: true, inseridos, erros });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

export default router;
