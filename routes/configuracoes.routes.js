import express from "express";
import { getConfig, updateConfig } from "../modules/config.js";
const router = express.Router();

router.get("/", (_req, res) => res.json(getConfig()));
router.put("/", (req, res) => res.json(updateConfig(req.body || {})));

export default router;
