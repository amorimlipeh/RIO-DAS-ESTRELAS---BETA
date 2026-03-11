import express from "express";
import { listarEnderecos, gerarMapaAutomatico } from "../modules/enderecos.js";
const router = express.Router();

router.get("/", (_req, res) => res.json(listarEnderecos()));

router.post("/gerar-mapa", (req, res) => {
  res.json(gerarMapaAutomatico(req.body || {}));
});

export default router;
