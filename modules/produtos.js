window.loadProdutos = async function loadProdutos() {
  const q = document.getElementById('buscaProduto')?.value || '';
  const produtos = await window.api(`/api/produtos?q=${encodeURIComponent(q)}`);
  const lista = document.getElementById('produtosLista');
  lista.innerHTML = produtos.map((p) => `
    <div class="item">
      <strong>${p.codigo} - ${p.nome}</strong>
      <div><span class="badge">Material: ${p.material || '-'}</span><span class="badge">Qtde: ${p.quantidade}</span></div>
      <div>📍 ${p.endereco || 'Sem endereço'}</div>
      ${p.imagem ? `<img src="${p.imagem}" alt="${p.nome}" style="width:100%;max-width:180px;margin-top:10px;border-radius:10px;">` : ''}
    </div>
  `).join('') || '<div class="item">Nenhum produto encontrado.</div>';
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('buscaProduto').addEventListener('input', () => window.loadProdutos());
  document.getElementById('produtoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.append('usuario', window.state?.user?.usuario || 'sistema');
    try {
      await fetch('/api/produtos', { method: 'POST', body: fd }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Erro ao salvar produto');
        return j;
      });
      form.reset();
      await window.refreshAll();
    } catch (error) {
      alert(error.message);
    }
  });
});
