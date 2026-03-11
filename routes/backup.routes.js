import express from "express";
import { gerarBackup } from "../modules/backup.js";
const router = express.Router();

router.post("/", (_req, res) => res.json({ ok: true, ...gerarBackup() }));

export default router;
