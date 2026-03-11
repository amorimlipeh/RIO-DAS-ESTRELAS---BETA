import { readJson, writeJson, generateId } from "./db.js";
import { getConfig } from "./config.js";

const file = "enderecos.json";

export function listarEnderecos() {
  return readJson(file, []);
}

export function gerarEndereco({ rua, posicao, andar = "1", posicaoFinal = "" }) {
  const r = String(rua).padStart(2, "0");
  const p = String(posicao).padStart(3, "0");
  return [r, p, andar, posicaoFinal].filter(Boolean).join("-");
}

export function gerarMapaAutomatico({ ruaInicial = 1, ruaFinal = 10, posicaoMax = 20, andares = 3 }) {
  const config = getConfig();
  const atuais = readJson(file, []);
  const mapa = [...atuais];

  for (let r = ruaInicial; r <= ruaFinal; r++) {
    const rua = String(r).padStart(2, "0");
    for (let p = 1; p <= posicaoMax; p++) {
      const posicao = String(p).padStart(3, "0");
      for (let a = 1; a <= andares; a++) {
        const endereco = `${rua}-${posicao}-${a}`;
        if (!mapa.find((x) => x.endereco === endereco)) {
          mapa.push({
            id: generateId("END"),
            endereco,
            rua,
            posicao,
            andar: String(a),
            status: config.ruasBloqueadas.includes(rua) ? "bloqueado" : "livre",
            produtoCodigo: "",
            quantidade: 0
          });
        }
      }
    }
  }
  writeJson(file, mapa);
  return mapa;
}
