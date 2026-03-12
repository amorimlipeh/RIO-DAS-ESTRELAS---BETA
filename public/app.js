window.APP_VERSION = '11.2-login-hardfix';
window.state = { user: null };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

window.api = async (url, options = {}) => {
  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.headers || {}),
      'Cache-Control': 'no-cache'
    }
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!response.ok) {
    throw new Error(data.error || data.message || `Erro ${response.status} ao acessar ${url}`);
  }
  return data;
};

function setupTabs() {
  $$('#tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#tabs button').forEach((b) => b.classList.remove('active'));
      $$('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      $(`#tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

async function loadDashboard() {
  const data = await api('/api/dashboard');
  $('#tab-dashboard').innerHTML = `
    <div class="dashboard-cards">
      <div class="stat"><h3>${data.produtos}</h3><p>Produtos cadastrados</p></div>
      <div class="stat"><h3>${data.totalEstoque}</h3><p>Total em estoque</p></div>
      <div class="stat"><h3>${data.pedidos}</h3><p>Pedidos</p></div>
    </div>
    <div class="card" style="margin-top:12px;">
      <h3>Últimos logs</h3>
      <div class="list">
        ${data.logsRecentes.map(l => `<div class="item"><strong>📜 ${l.dataHora}</strong><div>${l.usuario} • ${l.acao}</div></div>`).join('') || '<div class="item">Sem logs.</div>'}
      </div>
    </div>
  `;
}

window.loadLogs = async function loadLogs() {
  const logs = await api('/api/logs');
  const el = $('#logsLista');
  if (!el) return;
  el.innerHTML = logs.map((l) => `
    <div class="item">
      <strong>📜 ${l.dataHora}</strong>
      <div>${l.usuario} • ${l.acao}</div>
    </div>
  `).join('') || '<div class="item">Sem logs.</div>';
};

window.refreshAll = async function refreshAll() {
  await loadDashboard();
  await window.loadProdutos?.();
  await window.loadMapa?.();
  await window.loadPedidos?.();
  await window.loadLogs?.();
};

window.startApp = async function startApp(user) {
  state.user = user;
  $('#userLabel').textContent = `${user.nome} • ${user.tipo}`;
  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  setupTabs();
  $('#logoutBtn').onclick = () => location.reload();
  try {
    await refreshAll();
  } catch (error) {
    alert('Login feito, mas houve erro ao carregar a tela: ' + error.message);
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  const msg = document.getElementById('loginMsg');
  if (msg) {
    msg.textContent = 'Verificando servidor...';
    try {
      await window.api('/api/ping');
      msg.textContent = 'Servidor online. Faça login.';
    } catch (error) {
      msg.textContent = 'Servidor offline ou desatualizado: ' + error.message;
    }
  }

  const limparBtn = document.getElementById('limparLogsBtn');
  if (limparBtn) {
    limparBtn.onclick = async () => {
      if (!confirm('Limpar todos os logs?')) return;
      await window.api('/api/logs', { method: 'DELETE' });
      await window.loadLogs();
    };
  }
});
