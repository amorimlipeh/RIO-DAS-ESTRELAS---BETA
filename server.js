import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";

import produtosRouter from "./routes/produtos.routes.js";
import estoqueRouter from "./routes/estoque.routes.js";
import enderecosRouter from "./routes/enderecos.routes.js";
import pedidosRouter from "./routes/pedidos.routes.js";
import recebimentoRouter from "./routes/recebimento.routes.js";
import inventariosRouter from "./routes/inventarios.routes.js";
import notificacoesRouter from "./routes/notificacoes.routes.js";
import relatoriosRouter from "./routes/relatorios.routes.js";
import configRouter from "./routes/configuracoes.routes.js";
import authRouter from "./routes/auth.routes.js";
import backupRouter from "./routes/backup.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
["data", "uploads/imagens", "uploads/arquivos", "uploads/importacoes", "uploads/temporarios", "backups"].forEach((folder) => {
  ensureDir(path.join(__dirname, folder));
});

const upload = multer({ dest: path.join(__dirname, "uploads/temporarios") });

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/ping", (_req, res) => res.json({ ok: true, app: "SISTEMA DE ESTOQUE ✨ RIO DAS ESTRELAS 🌟" }));

app.use("/api/auth", authRouter);
app.use("/api/produtos", produtosRouter);
app.use("/api/estoque", estoqueRouter);
app.use("/api/enderecos", enderecosRouter);
app.use("/api/pedidos", pedidosRouter);
app.use("/api/recebimento", recebimentoRouter);
app.use("/api/inventarios", inventariosRouter);
app.use("/api/notificacoes", notificacoesRouter);
app.use("/api/relatorios", relatoriosRouter);
app.use("/api/configuracoes", configRouter);
app.use("/api/backup", backupRouter);

app.post("/api/importacao/upload", upload.single("arquivo"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, message: "Arquivo não enviado." });
  res.json({
    ok: true,
    arquivo: req.file.filename,
    nomeOriginal: req.file.originalname,
    modo: "misto",
    message: "Arquivo recebido. Fluxo pronto para importação manual ou automática."
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`SISTEMA DE ESTOQUE ✨ RIO DAS ESTRELAS 🌟 rodando na porta ${PORT}`);
});
