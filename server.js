import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import produtosRoutes from './routes/produtos.routes.js';
import estoqueRoutes from './routes/estoque.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import enderecosRoutes from './routes/enderecos.routes.js';
import inventariosRoutes from './routes/inventarios.routes.js';
import notificacoesRoutes from './routes/notificacoes.routes.js';
import recebimentoRoutes from './routes/recebimento.routes.js';
import relatoriosRoutes from './routes/relatorios.routes.js';
import configuracoesRoutes from './routes/configuracoes.routes.js';
import backupRoutes from './routes/backup.routes.js';
import logsRoutes from './routes/logs.routes.js';
import importacaoRoutes from './routes/importacao.routes.js';
import wmsRoutes from './routes/wms.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { readJson, writeJson } from './modules/db.js';
import { addLog } from './modules/logs.js';

const app = express();
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const assetsDir = path.join(publicDir, 'assets');
const uploadsDir = path.join(__dirname, 'uploads');
const backupsDir = path.join(__dirname, 'backups');
const requiredDirs = [
  path.join(__dirname, 'data'),
  uploadsDir,
  path.join(uploadsDir, 'imagens'),
  path.join(uploadsDir, 'documentos'),
  path.join(uploadsDir, 'importacao'),
  backupsDir
];
requiredDirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const defaults = {
  'usuarios.json': [{ id: 'USR-admin', usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin', tipo: 'admin', ativo: true }],
  'produtos.json': [],
  'estoque.json': [],
  'pedidos.json': [],
  'enderecos.json': [],
  'logs.json': []
};
for (const [name, value] of Object.entries(defaults)) {
  const full = path.join(__dirname, 'data', name);
  if (!fs.existsSync(full)) fs.writeFileSync(full, JSON.stringify(value, null, 2));
}

const sessions = new Map();

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const idx = part.indexOf('=');
    return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
  }));
}

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  const token = parseCookies(req.headers.cookie || '').rio_session;
  req.user = token ? sessions.get(token) || null : null;
  next();
});

app.get('/api/ping', (_req, res) => res.json({ status: 'ok', app: 'rio-das-estrelas-v11.1' }));

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body || {};
  const usuarios = readJson('usuarios.json', defaults['usuarios.json']);
  const found = usuarios.find((u) => String(u.usuario).trim() === String(usuario || '').trim() && String(u.senha).trim() === String(senha || '').trim() && u.ativo !== false);
  if (!found) {
    return res.status(401).json({ ok: false, mensagem: 'Usuário ou senha inválidos' });
  }
  const sessionUser = {
    id: found.id || `USR-${found.usuario}`,
    usuario: found.usuario,
    nome: found.nome || found.usuario,
    perfil: found.perfil || found.tipo || 'usuario',
    tipo: found.tipo || found.perfil || 'usuario'
  };
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, sessionUser);
  res.setHeader('Set-Cookie', `rio_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}`);
  addLog({ usuario: sessionUser.usuario, acao: 'login', modulo: 'auth', descricao: `Login do usuário ${sessionUser.usuario}.` });
  return res.json({ ok: true, usuario: sessionUser });
});

app.post('/api/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie || '').rio_session;
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', 'rio_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/session', (req, res) => {
  res.json({ ok: !!req.user, usuario: req.user || null });
});

app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/enderecos', enderecosRoutes);
app.use('/api/inventarios', inventariosRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/recebimento', recebimentoRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/configuracoes', configuracoesRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/importar', importacaoRoutes);
app.use('/api/wms', wmsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/assets', express.static(assetsDir));
app.use('/uploads', express.static(uploadsDir));
app.use('/backups', express.static(backupsDir));
app.use(express.static(publicDir));

app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/app', (_req, res) => res.sendFile(path.join(assetsDir, 'index.html')));
app.get('/app.html', (_req, res) => res.redirect('/app'));

app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`Projeto Rio das Estrelas V11.1 rodando na porta ${PORT}`);
});
