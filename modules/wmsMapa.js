window.loadMapa = async function loadMapa() {
  const mapa = await window.api('/api/wms/mapa');
  const el = document.getElementById('wmsMapa');
  const ruas = Object.keys(mapa).sort();
  el.innerHTML = `<div class="mapa-grid">${ruas.map((rua) => `
    <div class="rua">
      <h4>Rua ${rua}</h4>
      <div class="rua-locais">
        ${Object.keys(mapa[rua]).sort().map((numero) => `
          <div class="local-card">
            <strong>${numero}</strong>
            ${mapa[rua][numero].map((p) => `<div>${p.codigo} • ${p.nome}<br>Andar ${p.andar} • Posição ${p.posicao} • Qtde ${p.quantidade}</div>`).join('<hr style="border-color:#334155;">')}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}</div>`;
};
