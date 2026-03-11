import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");

export function ensureFile(fileName, defaultValue) {
  const full = path.join(dataDir, fileName);
  if (!fs.existsSync(full)) {
    fs.writeFileSync(full, JSON.stringify(defaultValue, null, 2));
  }
  return full;
}

export function readJson(fileName, defaultValue = []) {
  const full = ensureFile(fileName, defaultValue);
  const raw = fs.readFileSync(full, "utf-8") || "[]";
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function writeJson(fileName, data) {
  const full = ensureFile(fileName, Array.isArray(data) ? [] : {});
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
  return data;
}

export function generateId(prefix = "ID") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
