const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erro na requisição");
  return data;
}

function switchView(view) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  $("#" + view).classList.add("active");
  $("#view-title").textContent = view[0].toUpperCase() + view.slice(1);
}

$$('nav button').forEach((btn) => btn.addEventListener('click', () => switchView(btn.dataset.view)));

function fmtDate(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v || '-') : d.toLocaleString('pt-BR');
}

function fmtEndereco(item = {}) {
  if (item.endereco) return item.endereco;
  const rua = String(item.rua || '00').padStart(2, '0');
  const numero = String(item.numero || item.posicao || '001').padStart(3, '0');
  const andar = String(item.andar || '1');
  const posicao = String(item.posicao || '1');
  return `${rua}-${numero}-${andar}-${posicao}`;
}

async function loadDashboard() {
  const data = await api('/api/relatorios/dashboard');
  const logs = data.ultimosLogs || [];
  $('#dashboard').innerHTML = `
    <div class="kpis">
      <div class="kpi"><span>Produtos</span><strong>${data.produtosCadastrados || 0}</strong></div>
      <div class="kpi"><span>Estoque total</span><strong>${data.estoqueTotal || 0}</strong></div>
      <div class="kpi"><span>Pedidos em aberto</span><strong>${data.pedidosSeparacao || 0}</strong></div>
      <div class="kpi"><span>Recebimentos pendentes</span><strong>${data.recebimentosPendentes || 0}</strong></div>
      <div class="kpi"><span>Ocupação</span><strong>${data.ocupacaoArmazem || 0}%</strong></div>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>Últimos logs</h2>
      <div class="list">
        ${logs.map(log => `<div class="item"><strong>${log.modulo || log.tipo || 'sistema'}</strong><br>${log.descricao || log.mensagem || log.acao || 'evento'}<br><small>${fmtDate(log.dataHora || log.data)}</small></div>`).join('') || "<div class='item'>Sem logs.</div>"}
      </div>
    </div>
  `;
}

async function loadProdutos(q = '') {
  const items = await api('/api/produtos' + (q ? `?q=${encodeURIComponent(q)}` : ''));
  $('#lista-produtos').innerHTML = items.map(item => `
    <div class="item">
      <strong>${item.codigo}</strong> - ${item.nome}<br>
      <small>${item.material || ''} • mínimo ${Number(item.estoqueMinimo || 0)}</small>
    </div>
  `).join('') || "<div class='item'>Nenhum produto.</div>";
}

async function loadResumoEstoque() {
  const data = await api('/api/estoque/resumo');
  $('#resumo-estoque').innerHTML = Object.entries(data).map(([codigo, qtd]) => `
    <div class="item"><strong>${codigo}</strong><br>Saldo: ${qtd}</div>
  `).join('') || "<div class='item'>Sem dados.</div>";
}

async function loadEnderecos() {
  const items = await api('/api/enderecos');
  $('#lista-enderecos').innerHTML = items.slice(0, 80).map(item => `
    <div class="item">
      <strong>${fmtEndereco(item)}</strong>
      <span class="badge ${item.status === 'bloqueado' ? 'alta' : item.status === 'ocupado' ? 'media' : 'baixa'}">${item.status || 'livre'}</span>
    </div>
  `).join('') || "<div class='item'>Sem endereços.</div>";

  const mapa = await api('/api/wms/mapa');
  const ruas = Object.keys(mapa).sort();
  const el = $('#wms-mapa');
  if (el) {
    el.innerHTML = ruas.map((rua) => `
      <div class="card" style="margin-top:12px">
        <h2>Rua ${rua}</h2>
        <div class="list">
          ${Object.keys(mapa[rua]).sort().map((numero) => {
            const itens = mapa[rua][numero];
            const ocupado = itens.some((i) => Number(i.quantidade || 0) > 0);
            return `<div class="item"><strong>${rua}-${numero}</strong> <span class="badge ${ocupado ? 'media' : 'baixa'}">${ocupado ? 'ocupado' : 'livre'}</span><br>${itens.map((p) => `${p.codigo} • Andar ${p.andar} • Qtde ${p.quantidade}`).join('<br>') || 'Sem produto'}</div>`;
          }).join('')}
        </div>
      </div>
    `).join('') || '<div class="item">Mapa vazio.</div>';
  }
}

async function loadPedidos() {
  const items = await api('/api/pedidos');
  $('#lista-pedidos').innerHTML = items.map(item => `
    <div class="item">
      <strong>Pedido ${item.numero}</strong><br>
      Cliente: ${item.cliente || '-'}<br>
      Status: ${item.status}<br>
      Itens: ${(item.itens || []).length}
    </div>
  `).join('') || "<div class='item'>Sem pedidos.</div>";
}

async function loadNotificacoes() {
  const items = await api('/api/notificacoes');
  $('#lista-notificacoes').innerHTML = items.map(item => `
    <div class="item">
      <span class="badge ${item.prioridade || 'media'}">${item.prioridade || 'media'}</span>
      <strong>${item.mensagem || ''}</strong><br>
      <small>${fmtDate(item.dataHora)} • ${item.usuario || 'todos'}</small>
    </div>
  `).join('') || "<div class='item'>Sem notificações.</div>";
}

$('#form-produto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  await api('/api/produtos', { method: 'POST', body: JSON.stringify(payload) });
  e.target.reset();
  await loadProdutos();
  await loadDashboard();
});

$('#busca-produto').addEventListener('input', (e) => loadProdutos(e.target.value));

$('#form-estoque').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  await api('/api/estoque/movimentar', { method: 'POST', body: JSON.stringify(payload) });
  e.target.reset();
  await loadResumoEstoque();
  await loadDashboard();
  await loadEnderecos();
});

$('#form-mapa').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  await api('/api/enderecos/gerar-mapa', { method: 'POST', body: JSON.stringify(payload) });
  await loadEnderecos();
  await loadDashboard();
});

$('#form-pedido').addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = Object.fromEntries(new FormData(e.target).entries());
  const payload = { ...raw, itens: JSON.parse(raw.itensJson || '[]') };
  delete payload.itensJson;
  await api('/api/pedidos', { method: 'POST', body: JSON.stringify(payload) });
  e.target.reset();
  await loadPedidos();
  await loadDashboard();
});

$('#form-recebimento').addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = Object.fromEntries(new FormData(e.target).entries());
  const payload = { ...raw, itens: JSON.parse(raw.itensJson || '[]') };
  delete payload.itensJson;
  await api('/api/recebimento', { method: 'POST', body: JSON.stringify(payload) });
  alert('Recebimento registrado.');
  e.target.reset();
  await loadDashboard();
  await loadNotificacoes();
});

$('#form-inventario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  await api('/api/inventarios', { method: 'POST', body: JSON.stringify(payload) });
  alert('Inventário criado.');
  e.target.reset();
  await loadDashboard();
});

$('#form-notificacao').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  await api('/api/notificacoes', { method: 'POST', body: JSON.stringify(payload) });
  e.target.reset();
  await loadNotificacoes();
});

$('#form-config').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  await api('/api/configuracoes', {
    method: 'PUT',
    body: JSON.stringify({
      modos: {
        estoqueNegativo: form.estoqueNegativo,
        reservaPedido: form.reservaPedido,
        enderecamentoRecebimento: form.enderecamentoRecebimento
      }
    })
  });
  alert('Configurações salvas.');
});

async function boot() {
  try {
    await Promise.all([loadDashboard(), loadProdutos(), loadResumoEstoque(), loadEnderecos(), loadPedidos(), loadNotificacoes()]);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(console.error));
}

async function ensureSession() {
  try {
    const s = await api('/api/session');
    if (!s.ok) { location.href = '/'; return false; }
    return s.usuario || true;
  } catch {
    location.href = '/';
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await ensureSession();
  if (!usuario) return;
  const logout = document.createElement('button');
  logout.textContent = 'Sair';
  logout.style.marginLeft = '8px';
  logout.onclick = async () => { await api('/api/logout', { method: 'POST' }); location.href = '/'; };
  document.querySelector('.chips')?.appendChild(logout);
  const userInput = document.querySelector('#form-estoque input[name="usuario"]');
  if (userInput && usuario.usuario) userInput.value = usuario.usuario;
});

boot();
