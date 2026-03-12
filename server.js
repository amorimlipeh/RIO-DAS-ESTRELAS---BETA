import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const usuariosFile = path.join(dataDir, "usuarios.json");

function garantirEstrutura() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(usuariosFile)) {
    fs.writeFileSync(
      usuariosFile,
      JSON.stringify(
        [
          {
            usuario: "admin",
            senha: "admin123",
            tipo: "admin"
          }
        ],
        null,
        2
      ),
      "utf-8"
    );
  }
}

function lerUsuarios() {
  try {
    garantirEstrutura();
    const conteudo = fs.readFileSync(usuariosFile, "utf-8");
    const usuarios = JSON.parse(conteudo);

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return [
        {
          usuario: "admin",
          senha: "admin123",
          tipo: "admin"
        }
      ];
    }

    return usuarios;
  } catch (erro) {
    console.error("Erro ao ler usuarios.json:", erro);
    return [
      {
        usuario: "admin",
        senha: "admin123",
        tipo: "admin"
      }
    ];
  }
}

garantirEstrutura();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", (req, res) => {
  try {
    const { usuario, senha } = req.body || {};

    if (!usuario || !senha) {
      return res.status(400).json({
        ok: false,
        mensagem: "Usuário e senha são obrigatórios"
      });
    }

    const usuarios = lerUsuarios();

    const encontrado = usuarios.find(
      (u) =>
        String(u.usuario).trim() === String(usuario).trim() &&
        String(u.senha).trim() === String(senha).trim()
    );

    if (!encontrado) {
      return res.status(401).json({
        ok: false,
        mensagem: "Usuário ou senha inválidos"
      });
    }

    return res.json({
      ok: true,
      usuario: {
        usuario: encontrado.usuario,
        tipo: encontrado.tipo || "admin"
      }
    });
  } catch (erro) {
    console.error("Erro na rota /api/login:", erro);
    return res.status(500).json({
      ok: false,
      mensagem: "Erro interno no login"
    });
  }
});

app.use(express.static(publicDir));

app.get("/app", (req, res) => {
  res.sendFile(path.join(publicDir, "app.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Projeto Rio das Estrelas V11 rodando na porta ${PORT}`);
});
