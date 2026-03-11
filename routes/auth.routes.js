import express from "express";
import { readJson } from "../modules/db.js";
import { addLog } from "../modules/logs.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const usuarios = readJson("usuarios.json", []);
  const { usuario, senha } = req.body || {};
  const found = usuarios.find((u) => u.usuario === usuario && u.senha === senha && u.ativo !== false);
  if (!found) return res.status(401).json({ ok: false, message: "Usuário ou senha inválidos." });
  addLog({ modulo: "auth", acao: "login", descricao: `Login do usuário ${usuario}.` });
  res.json({ ok: true, usuario: { id: found.id, usuario: found.usuario, nome: found.nome, perfil: found.perfil } });
});

export default router;
