window.loadPedidos = async function loadPedidos() {
  const pedidos = await window.api('/api/pedidos');
  const lista = document.getElementById('pedidosLista');
  lista.innerHTML = pedidos.map((p) => `
    <div class="item">
      <strong>Pedido #${p.id} - ${p.cliente}</strong>
      <div><span class="badge">${p.status}</span></div>
      <div style="margin-top:8px;">${p.itens.map(i => `• ${i.codigo} - ${i.nome} | Qtde: ${i.quantidade} | End.: ${i.endereco}`).join('<br>')}</div>
    </div>
  `).join('') || '<div class="item">Nenhum pedido criado.</div>';
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pedidoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const itens = String(fd.get('itens') || '')
      .split(/\r?\n/)
      .filter(Boolean)
      .filter(Boolean)
      .map((line) => {
        const [codigo, quantidade] = line.split(',');
        return { codigo: (codigo || '').trim().toUpperCase(), quantidade: Number((quantidade || '0').trim()) };
      });
    try {
      await window.api('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: fd.get('cliente'),
          itens,
          usuario: window.state?.user?.usuario || 'sistema'
        })
      });
      e.currentTarget.reset();
      await window.refreshAll();
    } catch (error) {
      alert(error.message);
    }
  });
});
