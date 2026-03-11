import express from "express";
import { listarRecebimentos, criarRecebimento } from "../modules/recebimento.js";
const router = express.Router();

router.get("/", (_req, res) => res.json(listarRecebimentos()));
router.post("/", (req, res) => res.status(201).json(criarRecebimento(req.body || {})));

export default router;
