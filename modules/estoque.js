import { readJson, writeJson, generateId } from './db.js';
import { addLog } from './logs.js';
import { listarProdutos } from './produtos.js';

const file = 'estoque.json';
const enderecosFile = 'enderecos.json';

function norm(v) {
  return String(v || '').trim();
}

function up(v) {
  return norm(v).toUpperCase();
}

function nowIso() {
  return new Date().toISOString();
}

export function listarEstoque() {
  return readJson(file, []).map((i) => ({ ...i, quantidade: Number(i.quantidade || 0) }));
}

export function resumoEstoque() {
  const resumo = {};
  for (const item of listarEstoque()) {
    resumo[item.codigo] = Number(resumo[item.codigo] || 0) + Number(item.quantidade || 0);
  }
  return resumo;
}

function atualizarEndereco(payload) {
  const enderecos = readJson(enderecosFile, []);
  const endereco = norm(payload.endereco);
  if (!endereco) return;

  const [rua = '', numero = '', andar = '', posicao = ''] = endereco.split('-');
  let row = enderecos.find((e) => e.endereco === endereco || (e.rua === rua && (e.numero || e.posicao) === numero && e.andar === andar && (e.posicao === posicao || !posicao)));
  if (!row) {
    row = { id: generateId('END'), rua, numero, andar, posicao, endereco, lado: Number(numero || 0) % 2 === 0 ? 'par' : 'ímpar', status: 'livre', produtoCodigo: '', quantidade: 0 };
    enderecos.push(row);
  }
  row.endereco = endereco;
  row.produtoCodigo = payload.codigo;
  row.quantidade = Math.max(0, Number(row.quantidade || 0) + Number(payload.delta || 0));
  row.status = row.quantidade > 0 ? 'ocupado' : 'livre';
  writeJson(enderecosFile, enderecos);
}

export function movimentar(payload = {}) {
  const codigo = up(payload.produtoCodigo || payload.codigo);
  if (!codigo) throw new Error('Código do produto é obrigatório.');
  const quantidade = Number(payload.quantidade || 0);
  if (!Number.isFinite(quantidade) || quantidade <= 0) throw new Error('Quantidade inválida.');

  const produtos = listarProdutos();
  const produto = produtos.find((p) => up(p.codigo) === codigo);
  if (!produto) throw new Error('Produto não encontrado.');

  const tipo = norm(payload.tipo || 'entrada').toLowerCase();
  const resumo = resumoEstoque();
  const saldoAtual = Number(resumo[codigo] || 0);
  const delta = tipo === 'saida' ? -quantidade : quantidade;
  if (tipo === 'saida' && saldoAtual < quantidade) throw new Error('Saldo insuficiente para saída.');

  const item = {
    id: generateId('MOV'),
    codigo,
    nome: produto.nome,
    quantidade: delta,
    endereco: norm(payload.endereco || produto.endereco),
    tipo,
    motivo: norm(payload.motivo),
    usuario: norm(payload.usuario) || 'sistema',
    dataHora: nowIso()
  };

  const rows = listarEstoque();
  rows.unshift(item);
  writeJson(file, rows);
  atualizarEndereco({ endereco: item.endereco, codigo, delta });
  addLog({ usuario: item.usuario, acao: `${tipo} de estoque ${codigo}`, modulo: 'estoque', descricao: `${tipo} de ${quantidade} unidade(s) do produto ${codigo}.` });
  return { ...item, saldoAtual: saldoAtual + delta };
}
