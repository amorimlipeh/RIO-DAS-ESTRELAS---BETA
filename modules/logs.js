import { readJson, writeJson, generateId } from "./db.js";

const file = "logs.json";

export function addLog(entry) {
  const logs = readJson(file, []);
  const item = {
    id: generateId("LOG"),
    dataHora: new Date().toISOString(),
    ...entry
  };
  logs.unshift(item);
  writeJson(file, logs.slice(0, 1000));
  return item;
}

export function listLogs() {
  return readJson(file, []);
}
