import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const uploadsDir = path.join(__dirname, "uploads");
const imageDir = path.join(uploadsDir, "imagens");
const docsDir = path.join(uploadsDir, "documentos");
const importDir = path.join(uploadsDir, "importacao");
const publicDir = path.join(__dirname, "public");

for (const dir of [dataDir, uploadsDir, imageDir, docsDir, importDir, publicDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const ensureFile = (fileName, initialValue) => {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialValue, null, 2));
  }
};

ensureFile("produtos.json", []);
ensureFile("estoque.json", []);
ensureFile("pedidos.json", []);
ensureFile("enderecos.json", []);
ensureFile("usuarios.json", [
  {
    id: 1,
    nome: "Administrador",
    usuario: "admin",
    senha: "admin123",
    tipo: "Administrador"
  }
]);
ensureFile("logs.json", []);

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"));
const saveJson = (name, data) => fs.writeFileSync(path.join(dataDir, name), JSON.stringify(data, null, 2));

const nowBr = () => new Date().toLocaleString("pt-BR", { hour12: false });
const nextId = (items) => (items.length ? Math.max(...items.map((i) => Number(i.id) || 0)) + 1 : 1);

const normalize = (value = "") => String(value).trim();

const addLog = (acao, usuario = "sistema") => {
  const logs = readJson("logs.json");
  logs.unshift({ id: nextId(logs), dataHora: nowBr(), usuario, acao });
  saveJson("logs.json", logs);
};

const buildWmsMap = (produtos) => {
  const ruas = {};
  for (const p of produtos) {
    const endereco = p.endereco || "SEM-ENDERECO";
    const [rua = "00", numero = "000", andar = "0", posicao = "0"] = endereco.split("-");
    if (!ruas[rua]) ruas[rua] = {};
    if (!ruas[rua][numero]) ruas[rua][numero] = [];
    ruas[rua][numero].push({
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      andar,
      posicao,
      quantidade: Number(p.quantidade || 0)
    });
  }
  return ruas;
};

app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(publicDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const destination = isImage ? imageDir : importDir;
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    cb(null, safe);
  }
});
const upload = multer({ storage });

app.get("/api/ping", (req, res) => res.json({ status: "ok", version: "V11 Final" }));

app.post("/api/auth/login", (req, res) => {
  const { usuario, senha } = req.body;
  const usuarios = readJson("usuarios.json");
  const found = usuarios.find((u) => u.usuario === usuario && u.senha === senha);
  if (!found) return res.status(401).json({ error: "Usuário ou senha inválidos." });
  addLog(`Login realizado por ${found.nome}`, found.usuario);
  res.json({
    ok: true,
    usuario: { id: found.id, nome: found.nome, usuario: found.usuario, tipo: found.tipo }
  });
});

app.get("/api/dashboard", (req, res) => {
  const produtos = readJson("produtos.json");
  const pedidos = readJson("pedidos.json");
  const logs = readJson("logs.json");
  const totalEstoque = produtos.reduce((acc, p) => acc + Number(p.quantidade || 0), 0);
  res.json({
    produtos: produtos.length,
    pedidos: pedidos.length,
    totalEstoque,
    logsRecentes: logs.slice(0, 8)
  });
});

app.get("/api/produtos", (req, res) => {
  const q = (req.query.q || "").toUpperCase();
  const produtos = readJson("produtos.json");
  if (!q) return res.json(produtos);
  const filtered = produtos.filter((p) => {
    const bag = `${p.codigo} ${p.nome} ${p.material} ${p.endereco}`.toUpperCase();
    return bag.includes(q);
  });
  res.json(filtered);
});

app.post("/api/produtos", upload.single("imagem"), (req, res) => {
  const produtos = readJson("produtos.json");
  const codigo = normalize(req.body.codigo).toUpperCase();
  if (!codigo) return res.status(400).json({ error: "Código é obrigatório." });
  const existing = produtos.find((p) => p.codigo === codigo);
  if (existing) return res.status(400).json({ error: "Já existe produto com esse código." });

  const produto = {
    id: nextId(produtos),
    codigo,
    nome: normalize(req.body.nome),
    material: normalize(req.body.material),
    quantidade: Number(req.body.quantidade || 0),
    endereco: normalize(req.body.endereco || "00-000-0-0"),
    codigoBarras: normalize(req.body.codigoBarras || codigo),
    imagem: req.file ? `/uploads/imagens/${req.file.filename}` : "",
    criadoEm: nowBr()
  };
  produtos.push(produto);
  saveJson("produtos.json", produtos);
  saveJson("estoque.json", produtos.map(({ id, codigo, nome, quantidade, endereco }) => ({ id, codigo, nome, quantidade, endereco })));
  addLog(`Produto cadastrado: ${produto.codigo} - ${produto.nome}`, req.body.usuario || "sistema");
  res.json(produto);
});

app.put("/api/produtos/:id", upload.single("imagem"), (req, res) => {
  const produtos = readJson("produtos.json");
  const index = produtos.findIndex((p) => String(p.id) === String(req.params.id));
  if (index < 0) return res.status(404).json({ error: "Produto não encontrado." });
  const current = produtos[index];
  produtos[index] = {
    ...current,
    codigo: normalize(req.body.codigo || current.codigo).toUpperCase(),
    nome: normalize(req.body.nome || current.nome),
    material: normalize(req.body.material || current.material),
    quantidade: Number(req.body.quantidade ?? current.quantidade),
    endereco: normalize(req.body.endereco || current.endereco),
    codigoBarras: normalize(req.body.codigoBarras || current.codigoBarras),
    imagem: req.file ? `/uploads/imagens/${req.file.filename}` : current.imagem,
    atualizadoEm: nowBr()
  };
  saveJson("produtos.json", produtos);
  saveJson("estoque.json", produtos.map(({ id, codigo, nome, quantidade, endereco }) => ({ id, codigo, nome, quantidade, endereco })));
  addLog(`Produto atualizado: ${produtos[index].codigo}`, req.body.usuario || "sistema");
  res.json(produtos[index]);
});

app.delete("/api/produtos/:id", (req, res) => {
  const produtos = readJson("produtos.json");
  const found = produtos.find((p) => String(p.id) === String(req.params.id));
  if (!found) return res.status(404).json({ error: "Produto não encontrado." });
  const updated = produtos.filter((p) => String(p.id) !== String(req.params.id));
  saveJson("produtos.json", updated);
  saveJson("estoque.json", updated.map(({ id, codigo, nome, quantidade, endereco }) => ({ id, codigo, nome, quantidade, endereco })));
  addLog(`Produto removido: ${found.codigo}`, "sistema");
  res.json({ ok: true });
});

app.get("/api/wms/mapa", (req, res) => {
  const produtos = readJson("produtos.json");
  res.json(buildWmsMap(produtos));
});

app.get("/api/logs", (req, res) => res.json(readJson("logs.json")));
app.delete("/api/logs", (req, res) => {
  saveJson("logs.json", []);
  res.json({ ok: true });
});

app.get("/api/pedidos", (req, res) => res.json(readJson("pedidos.json")));
app.post("/api/pedidos", (req, res) => {
  const pedidos = readJson("pedidos.json");
  const produtos = readJson("produtos.json");
  const itens = Array.isArray(req.body.itens) ? req.body.itens : [];
  const itensComEndereco = itens.map((item) => {
    const produto = produtos.find((p) => p.codigo === item.codigo);
    return {
      codigo: item.codigo,
      quantidade: Number(item.quantidade || 0),
      endereco: produto?.endereco || "SEM-ENDERECO",
      nome: produto?.nome || "Produto não encontrado"
    };
  });
  const pedido = {
    id: nextId(pedidos),
    cliente: normalize(req.body.cliente || "Sem cliente"),
    status: "ABERTO",
    criadoEm: nowBr(),
    itens: itensComEndereco
  };
  pedidos.unshift(pedido);
  saveJson("pedidos.json", pedidos);
  addLog(`Pedido criado #${pedido.id}`, req.body.usuario || "sistema");
  res.json(pedido);
});

app.post('/api/importar', upload.single('arquivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie um arquivo.' });
  const produtos = readJson('produtos.json');
  const filepath = path.join(importDir, req.file.filename);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return res.status(400).json({ error: 'Arquivo sem conteúdo suficiente. Use CSV/TXT com cabeçalho.' });
  }
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const inserted = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    const row = Object.fromEntries(headers.map((h, i) => [h, (cols[i] || '').trim()]));
    if (!row.codigo) continue;
    const codigo = row.codigo.toUpperCase();
    if (produtos.some((p) => p.codigo === codigo)) continue;
    const item = {
      id: nextId(produtos.concat(inserted)),
      codigo,
      nome: row.nome || row.produto || '',
      material: row.material || '',
      quantidade: Number(row.quantidade || 0),
      endereco: row.endereco || '00-000-0-0',
      codigoBarras: row.codigobarras || codigo,
      imagem: '',
      criadoEm: nowBr()
    };
    inserted.push(item);
  }
  const merged = produtos.concat(inserted);
  saveJson('produtos.json', merged);
  saveJson('estoque.json', merged.map(({ id, codigo, nome, quantidade, endereco }) => ({ id, codigo, nome, quantidade, endereco })));
  addLog(`Importação concluída: ${inserted.length} produto(s)`, 'sistema');
  res.json({ ok: true, inseridos: inserted.length, total: merged.length });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Projeto Rio das Estrelas V11 rodando na porta ${PORT}`);
});
