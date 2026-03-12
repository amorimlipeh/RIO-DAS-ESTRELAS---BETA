document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('importMsg');
    msg.textContent = 'Importando...';
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch('/api/importar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na importação');
      msg.textContent = `Importação concluída. ${data.inseridos} produto(s) inserido(s).`;
      e.currentTarget.reset();
      await window.refreshAll();
    } catch (error) {
      msg.textContent = error.message;
    }
  });
});
