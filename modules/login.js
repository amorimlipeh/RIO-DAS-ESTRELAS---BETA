async function fazerLogin() {
  const usuario = document.querySelector("#usuario").value;
  const senha = document.querySelector("#senha").value;

  try {
    const resposta = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await resposta.json();

    if (dados.ok) {
      alert("Login realizado");
      location.reload();
    } else {
      alert("Usuário ou senha inválidos");
    }

  } catch (erro) {
    console.error("Erro no login:", erro);
    alert("Erro ao conectar com o servidor");
  }
}

document.querySelector("#btnLogin").addEventListener("click", fazerLogin);
