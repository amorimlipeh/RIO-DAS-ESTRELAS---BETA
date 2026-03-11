import express from "express";
import { listarInventarios, criarInventario } from "../modules/inventarios.js";
const router = express.Router();

router.get("/", (_req, res) => res.json(listarInventarios()));
router.post("/", (req, res) => res.status(201).json(criarInventario(req.body || {})));

export default router;
