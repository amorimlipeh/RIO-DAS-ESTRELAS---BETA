document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const button = form?.querySelector('button[type="submit"]');
  const msg = document.getElementById('loginMsg');

  async function doLogin(e) {
    e?.preventDefault?.();
    if (!form) return;
    const usuario = form.usuario.value.trim();
    const senha = form.senha.value;
    msg.textContent = 'Entrando...';
    if (button) button.disabled = true;
    try {
      const data = await window.api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
      });
      msg.textContent = 'Login realizado.';
      await window.startApp(data.usuario);
    } catch (error) {
      msg.textContent = error.message || 'Falha no login.';
    } finally {
      if (button) button.disabled = false;
    }
  }

  form?.addEventListener('submit', doLogin);
  button?.addEventListener('click', doLogin);
});
