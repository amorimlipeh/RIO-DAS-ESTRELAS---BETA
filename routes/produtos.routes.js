import express from "express";
import { listarProdutos, buscarProdutos, criarProduto, atualizarProduto, removerProduto } from "../modules/produtos.js";
const router = express.Router();

router.get("/", (req, res) => {
  const { q } = req.query;
  res.json(q ? buscarProdutos(q) : listarProdutos());
});

router.post("/", (req, res) => {
  try {
    res.status(201).json(criarProduto(req.body || {}));
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

router.put("/:id", (req, res) => {
  const item = atualizarProduto(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ ok: false, message: "Produto não encontrado." });
  res.json(item);
});

router.delete("/:id", (req, res) => {
  const item = removerProduto(req.params.id);
  if (!item) return res.status(404).json({ ok: false, message: "Produto não encontrado." });
  res.json({ ok: true, item });
});

export default router;
