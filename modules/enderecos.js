import { readJson, writeJson, generateId } from "./db.js";
import { getConfig } from "./config.js";

const file = "enderecos.json";

function pad2(v) {
  return String(v || "").padStart(2, "0");
}

function pad3(v) {
  return String(v || "").padStart(3, "0");
}

function normalizeEndereco(item = {}) {
  const rua = pad2(item.rua || item.corredor || "00");
  const numeroBase = item.numero || item.posicao || item.coluna || "001";
  const numero = pad3(numeroBase);
  const andar = String(item.andar || item.nivel || "1");
  const posicao = String(item.posicaoFinal || item.face || item.posicao || item.final || "1");
  const endereco = item.endereco || [rua, numero, andar, posicao].filter(Boolean).join("-");
  const quantidade = Number(item.quantidade || 0);
  const lado = item.lado || (Number(numero) % 2 === 0 ? "par" : "ímpar");
  const status = item.status || (quantidade > 0 ? "ocupado" : "livre");
  return {
    id: item.id || generateId("END"),
    rua,
    numero,
    andar,
    posicao,
    endereco,
    lado,
    status,
    produtoCodigo: item.produtoCodigo || "",
    quantidade
  };
}

export function listarEnderecos() {
  const rows = readJson(file, []);
  const normalized = rows.map((item) => normalizeEndereco(item));
  writeJson(file, normalized);
  return normalized;
}

export function gerarEndereco({ rua, posicao, andar = "1", posicaoFinal = "1" }) {
  const r = pad2(rua);
  const p = pad3(posicao);
  return [r, p, andar, posicaoFinal].filter(Boolean).join("-");
}

export function gerarMapaAutomatico({ ruaInicial = 1, ruaFinal = 10, posicaoMax = 20, andares = 3 }) {
  const config = getConfig();
  const atuais = listarEnderecos();
  const mapa = [...atuais];

  for (let r = Number(ruaInicial); r <= Number(ruaFinal); r++) {
    const rua = pad2(r);
    for (let p = 1; p <= Number(posicaoMax); p++) {
      const numero = pad3(p);
      for (let a = 1; a <= Number(andares); a++) {
        const endereco = `${rua}-${numero}-${a}-1`;
        if (!mapa.find((x) => x.endereco === endereco)) {
          mapa.push(normalizeEndereco({
            rua,
            numero,
            andar: String(a),
            posicao: "1",
            endereco,
            status: config.ruasBloqueadas.includes(rua) ? "bloqueado" : "livre"
          }));
        }
      }
    }
  }
  writeJson(file, mapa);
  return mapa;
}
