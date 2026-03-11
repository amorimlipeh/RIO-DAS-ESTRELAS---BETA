import express from "express";
import { listarEstoque, movimentar, resumoEstoque } from "../modules/estoque.js";
const router = express.Router();

router.get("/", (_req, res) => res.json(listarEstoque()));
router.get("/resumo", (_req, res) => res.json(resumoEstoque()));

router.post("/movimentar", (req, res) => {
  try {
    res.status(201).json(movimentar(req.body || {}));
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

export default router;
