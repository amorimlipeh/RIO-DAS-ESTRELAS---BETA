import express from "express";
import { listarPedidos, criarPedido, atualizarPedido, registrarNaoEmbarcado } from "../modules/pedidos.js";
const router = express.Router();

router.get("/", (_req, res) => res.json(listarPedidos()));

router.post("/", (req, res) => {
  res.status(201).json(criarPedido(req.body || {}));
});

router.put("/:id", (req, res) => {
  const item = atualizarPedido(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ ok: false, message: "Pedido não encontrado." });
  res.json(item);
});

router.post("/:id/nao-embarcado", (req, res) => {
  const item = registrarNaoEmbarcado(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ ok: false, message: "Pedido não encontrado." });
  res.json(item);
});

export default router;
