import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const dataDir = path.join(__dirname, "data");
const produtosFile = path.join(dataDir, "produtos.json");

function ensureDataFile(file, fallback = []) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
}

function readJson(file, fallback = []) {
  ensureDataFile(file, fallback);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDataFile(file, []);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

ensureDataFile(produtosFile, []);

/* APIs principais */
app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, status: "ok" });
});

app.get("/api/produtos", (_req, res) => {
  const produtos = readJson(produtosFile, []);
  res.json({ ok: true, items: produtos, total: produtos.length });
});

app.post("/api/produtos", (req, res) => {
  const { codigo = "", nome = "", material = "", quantidade = 0 } = req.body || {};
  if (!codigo.trim()) {
    return res.status(400).json({ ok: false, error: "Código é obrigatório." });
  }

  const produtos = readJson(produtosFile, []);
  const idx = produtos.findIndex(p => String(p.codigo).toLowerCase() === String(codigo).toLowerCase());

  const registro = {
    codigo: codigo.trim(),
    nome: nome.trim(),
    material: material.trim(),
    quantidade: Number(quantidade || 0),
    atualizadoEm: new Date().toISOString()
  };

  if (idx >= 0) {
    produtos[idx] = { ...produtos[idx], ...registro };
  } else {
    produtos.push({ ...registro, criadoEm: new Date().toISOString() });
  }

  writeJson(produtosFile, produtos);
  res.json({ ok: true, item: registro, total: produtos.length });
});

/* Rotas auxiliares para não quebrar botões/atalhos */
app.get("/api/github", (_req, res) => {
  res.json({ ok: true, label: "GitHub", message: "Atalho disponível." });
});

app.get("/api/railway", (_req, res) => {
  res.json({ ok: true, label: "Railway", message: "Atalho disponível." });
});

app.get("/api/pwa", (_req, res) => {
  res.json({ ok: true, label: "PWA", message: "PWA em preparação." });
});

/* Fallback SPA */
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Sistema rodando na porta " + PORT);
});