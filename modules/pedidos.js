import { readJson, writeJson, generateId } from './db.js';
import { addLog } from './logs.js';
import { listarProdutos } from './produtos.js';
import { resumoEstoque } from './estoque.js';

const file = 'pedidos.json';

function norm(v) {
  return String(v || '').trim();
}

function up(v) {
  return norm(v).toUpperCase();
}

export function listarPedidos() {
  return readJson(file, []);
}

export function criarPedido(payload = {}) {
  const produtos = listarProdutos();
  const resumo = resumoEstoque();
  const itens = Array.isArray(payload.itens) ? payload.itens : [];
  if (!itens.length) throw new Error('Pedido sem itens.');

  const normalizados = itens.map((item) => {
    const codigo = up(item.produtoCodigo || item.codigo);
    const produto = produtos.find((p) => up(p.codigo) === codigo);
    if (!produto) throw new Error(`Produto ${codigo} não encontrado.`);
    const quantidade = Number(item.quantidade || 0);
    if (quantidade <= 0) throw new Error(`Quantidade inválida para ${codigo}.`);
    return {
      produtoCodigo: codigo,
      codigo,
      nome: produto.nome,
      quantidade,
      endereco: produto.endereco || '',
      saldoDisponivel: Number(resumo[codigo] || 0)
    };
  });

  const item = {
    id: generateId('PED'),
    numero: norm(payload.numero) || `PED-${Date.now()}`,
    cliente: norm(payload.cliente),
    status: 'novo',
    container: norm(payload.container || payload.conteiner),
    tipoRecebimento: norm(payload.tipoRecebimento || 'pedido'),
    itens: normalizados,
    criadoEm: new Date().toISOString(),
    usuario: norm(payload.usuario) || 'sistema'
  };

  const rows = listarPedidos();
  rows.unshift(item);
  writeJson(file, rows);
  addLog({ usuario: item.usuario, acao: `Pedido ${item.numero} criado`, modulo: 'pedidos', descricao: `Pedido ${item.numero} criado com ${item.itens.length} item(ns).` });
  return item;
}

export function atualizarPedido(id, payload = {}) {
  const rows = listarPedidos();
  const idx = rows.findIndex((p) => String(p.id) === String(id) || String(p.numero) === String(id));
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...payload, atualizadoEm: new Date().toISOString() };
  writeJson(file, rows);
  return rows[idx];
}

export function registrarNaoEmbarcado(id, payload = {}) {
  const pedido = atualizarPedido(id, {
    status: 'nao_embarcado',
    naoEmbarcadoMotivo: norm(payload.motivo),
    naoEmbarcadoEm: new Date().toISOString()
  });
  if (pedido) {
    addLog({ usuario: norm(payload.usuario) || 'sistema', acao: `Pedido ${pedido.numero} não embarcado`, modulo: 'pedidos', descricao: `Pedido ${pedido.numero} marcado como não embarcado.` });
  }
  return pedido;
}
