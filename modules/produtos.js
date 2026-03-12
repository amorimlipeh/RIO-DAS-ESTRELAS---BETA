import { readJson, writeJson, generateId } from './db.js';
import { addLog } from './logs.js';

const file = 'produtos.json';
const estoqueFile = 'estoque.json';

function norm(v) {
  return String(v || '').trim();
}

function up(v) {
  return norm(v).toUpperCase();
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeProduto(item = {}) {
  return {
    id: item.id || generateId('PROD'),
    codigo: up(item.codigo),
    nome: norm(item.nome) || up(item.codigo),
    material: norm(item.material),
    categoria: norm(item.categoria),
    estoqueMinimo: Number(item.estoqueMinimo ?? item.estoque_minimo ?? item.minimo ?? 0),
    endereco: norm(item.endereco),
    codigoBarras: norm(item.codigoBarras || item.codigo_barras || item.codigo || ''),
    imagem: norm(item.imagem),
    criadoEm: item.criadoEm || nowIso(),
    atualizadoEm: item.atualizadoEm || item.criadoEm || nowIso(),
    quantidadeBase: Number(item.quantidade || 0)
  };
}

export function listarProdutos() {
  const produtos = readJson(file, []).map((p) => normalizeProduto(p));
  writeJson(file, produtos);
  const estoque = readJson(estoqueFile, []);
  return produtos.map((p) => {
    const saldoMov = estoque
      .filter((e) => up(e.codigo || e.produtoCodigo) === up(p.codigo))
      .reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
    const saldo = saldoMov || p.quantidadeBase || 0;
    return {
      ...p,
      quantidade: saldo,
      endereco: p.endereco || estoque.find((e) => up(e.codigo || e.produtoCodigo) === up(p.codigo))?.endereco || ''
    };
  });
}

function matchBusca(item, q) {
  const texto = [item.codigo, item.nome, item.material, item.categoria, item.endereco]
    .map((v) => up(v))
    .join(' ');
  const termo = up(q);
  if (!termo) return true;

  if (!termo.includes('%')) {
    return texto.includes(termo);
  }

  const partes = termo.split('%').map((p) => p.trim()).filter(Boolean);
  if (!partes.length) return true;
  return partes.every((parte) => texto.includes(parte));
}

export function buscarProdutos(q) {
  return listarProdutos().filter((item) => matchBusca(item, q));
}

export function criarProduto(payload = {}) {
  const produtos = readJson(file, []).map((p) => normalizeProduto(p));
  const estoque = readJson(estoqueFile, []);
  const codigo = up(payload.codigo);
  if (!codigo) throw new Error('Código é obrigatório.');
  if (produtos.some((p) => up(p.codigo) === codigo)) {
    throw new Error('Já existe produto com esse código.');
  }

  const quantidadeInicial = Number(payload.quantidade || 0);
  const item = normalizeProduto({
    id: generateId('PROD'),
    codigo,
    nome: norm(payload.nome) || codigo,
    material: norm(payload.material),
    categoria: norm(payload.categoria),
    estoqueMinimo: Number(payload.estoqueMinimo || 0),
    endereco: norm(payload.endereco),
    codigoBarras: norm(payload.codigoBarras) || codigo,
    imagem: norm(payload.imagem),
    criadoEm: nowIso(),
    atualizadoEm: nowIso(),
    quantidade: quantidadeInicial
  });

  produtos.unshift(item);
  writeJson(file, produtos);

  if (quantidadeInicial > 0) {
    estoque.push({
      id: generateId('EST'),
      codigo,
      nome: item.nome,
      quantidade: quantidadeInicial,
      endereco: item.endereco,
      tipo: 'entrada',
      motivo: 'cadastro-inicial',
      dataHora: nowIso(),
      usuario: norm(payload.usuario) || 'sistema'
    });
    writeJson(estoqueFile, estoque);
  }

  addLog({ usuario: norm(payload.usuario) || 'sistema', acao: `Produto ${codigo} criado`, modulo: 'produtos', descricao: `Cadastro do produto ${codigo}.` });
  return listarProdutos().find((p) => up(p.codigo) === codigo);
}

export function atualizarProduto(id, payload = {}) {
  const produtos = readJson(file, []).map((p) => normalizeProduto(p));
  const idx = produtos.findIndex((p) => String(p.id) === String(id) || up(p.codigo) === up(id));
  if (idx === -1) return null;

  const atual = produtos[idx];
  const codigo = up(payload.codigo || atual.codigo);
  const duplicado = produtos.find((p, i) => i !== idx && up(p.codigo) === codigo);
  if (duplicado) throw new Error('Já existe outro produto com esse código.');

  produtos[idx] = normalizeProduto({
    ...atual,
    ...payload,
    codigo,
    atualizadoEm: nowIso()
  });

  writeJson(file, produtos);
  addLog({ usuario: norm(payload.usuario) || 'sistema', acao: `Produto ${codigo} atualizado`, modulo: 'produtos', descricao: `Atualização do produto ${codigo}.` });
  return listarProdutos().find((p) => up(p.codigo) === codigo);
}

export function removerProduto(id) {
  const produtos = readJson(file, []).map((p) => normalizeProduto(p));
  const idx = produtos.findIndex((p) => String(p.id) === String(id) || up(p.codigo) === up(id));
  if (idx === -1) return null;
  const [removed] = produtos.splice(idx, 1);
  writeJson(file, produtos);
  addLog({ usuario: 'sistema', acao: `Produto ${removed.codigo} removido`, modulo: 'produtos', descricao: `Remoção do produto ${removed.codigo}.` });
  return removed;
}
