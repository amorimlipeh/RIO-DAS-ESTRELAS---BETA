import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const backupDir = path.join(root, "backups");
fs.mkdirSync(backupDir, { recursive: true });

export function gerarBackup() {
  const nome = `backup-estoque-${new Date().toISOString().slice(0, 10)}.zip`;
  const destino = path.join(backupDir, nome);
  try {
    execSync(`cd "${dataDir}" && zip -r "${destino}" .`, { stdio: "ignore" });
    return { nome, caminho: `/backups/${nome}` };
  } catch {
    const fallback = path.join(backupDir, `${nome}.json`);
    fs.copyFileSync(path.join(dataDir, "produtos.json"), fallback);
    return { nome: `${nome}.json`, caminho: `/backups/${nome}.json` };
  }
}
