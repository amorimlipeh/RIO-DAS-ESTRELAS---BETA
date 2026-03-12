
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/ping", (req,res)=>{
  res.json({status:"ok"});
});

app.listen(PORT, ()=>{
  console.log("Servidor rodando na porta " + PORT);
});
