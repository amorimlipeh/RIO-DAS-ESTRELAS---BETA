const drawer = document.getElementById("drawer");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");
const closeDrawer = document.getElementById("closeDrawer");

menuBtn.addEventListener("click", () => openDrawer());
closeDrawer.addEventListener("click", () => closeDrawerFn());
overlay.addEventListener("click", () => closeDrawerFn());

function openDrawer(){ drawer.classList.add("open"); overlay.classList.add("show"); }
function closeDrawerFn(){ drawer.classList.remove("open"); overlay.classList.remove("show"); }

document.querySelectorAll(".drawer-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.dataset.page);
    closeDrawerFn();
  });
});

function showPage(id){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");
}

async function apiGet(url){
  const res = await fetch(url);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error("Resposta inválida da rota " + url + ": " + text.slice(0, 60));
  }
  return res.json();
}

async function apiPost(url, body){
  const res = await fetch(url, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error("Resposta inválida da rota " + url + ": " + text.slice(0, 60));
  }
  return res.json();
}

document.querySelectorAll("[data-api]").forEach(btn => {
  btn.addEventListener("click", async () => {
    try {
      const data = await apiGet(btn.dataset.api);
      alert(data.message || "OK");
    } catch (err) {
      alert(err.message);
    }
  });
});

const totalProdutos = document.getElementById("totalProdutos");
const dashboardBusca = document.getElementById("dashboardBusca");
const dashboardResultados = document.getElementById("dashboardResultados");
const buscaProduto = document.getElementById("buscaProduto");
const listaProdutos = document.getElementById("listaProdutos");
const salvarProdutoBtn = document.getElementById("salvarProduto");

let produtos = [];

function filtroEspecial(codigo, termo){
  const raw = termo.trim().toLowerCase();
  if (!raw) return true;

  if (raw.includes("%")) {
    const partes = raw.split("%").filter(Boolean);
    return partes.every(p => codigo.toLowerCase().includes(p));
  }

  return codigo.toLowerCase().includes(raw);
}

function renderLista(alvo, termo){
  if (!produtos.length) {
    alvo.innerHTML = "Nenhum produto.";
    return;
  }

  const filtrados = produtos.filter(p =>
    filtroEspecial(String(p.codigo || ""), termo) ||
    String(p.nome || "").toLowerCase().includes((termo || "").toLowerCase())
  );

  if (!filtrados.length) {
    alvo.innerHTML = "Nenhum produto.";
    return;
  }

  alvo.innerHTML = filtrados.map(p => `
    <div class="result-item">
      <strong>${p.codigo || ""}</strong>${p.nome ? " - " + p.nome : ""}
      <div>Material: ${p.material || "-"}</div>
      <div>Quantidade: ${Number(p.quantidade || 0)}</div>
    </div>
  `).join("");
}

async function carregarProdutos(){
  try {
    const data = await apiGet("/api/produtos");
    produtos = data.items || [];
    totalProdutos.textContent = String(data.total || 0);
    renderLista(dashboardResultados, dashboardBusca.value);
    renderLista(listaProdutos, buscaProduto.value);
  } catch (err) {
    dashboardResultados.textContent = err.message;
    listaProdutos.textContent = err.message;
  }
}

salvarProdutoBtn.addEventListener("click", async () => {
  const codigo = document.getElementById("codigo").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const material = document.getElementById("material").value.trim();
  const quantidade = document.getElementById("quantidade").value.trim();

  try {
    const data = await apiPost("/api/produtos", { codigo, nome, material, quantidade });
    if (!data.ok) throw new Error(data.error || "Erro ao salvar.");
    document.getElementById("codigo").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("material").value = "";
    document.getElementById("quantidade").value = "";
    await carregarProdutos();
    alert("Produto salvo com sucesso.");
  } catch (err) {
    alert(err.message);
  }
});

dashboardBusca.addEventListener("input", () => renderLista(dashboardResultados, dashboardBusca.value));
buscaProduto.addEventListener("input", () => renderLista(listaProdutos, buscaProduto.value));

carregarProdutos();