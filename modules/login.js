document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msg = document.getElementById('loginMsg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Entrando...';
    try {
      const formData = new FormData(form);
      const data = await window.api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      msg.textContent = 'Login realizado.';
      window.startApp(data.usuario);
    } catch (error) {
      msg.textContent = error.message;
    }
  });
});
