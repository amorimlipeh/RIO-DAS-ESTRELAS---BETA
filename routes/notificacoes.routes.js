import express from "express";
import { listarNotificacoes, criarNotificacao, atualizarNotificacao } from "../modules/notificacoes.js";
const router = express.Router();

router.get("/", (_req, res) => res.json(listarNotificacoes()));
router.post("/", (req, res) => res.status(201).json(criarNotificacao(req.body || {})));
router.put("/:id", (req, res) => {
  const item = atualizarNotificacao(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ ok: false, message: "Notificação não encontrada." });
  res.json(item);
});

export default router;
