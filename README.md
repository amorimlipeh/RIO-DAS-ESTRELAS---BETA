# Projeto Rio das Estrelas - V11 Final

Sistema de estoque com funções WMS, cadastro único de produtos, mapa WMS, importação simples, logs, pedidos e suporte a imagens.

## Rodar localmente

```bash
npm install
npm start
```

Acesse `http://localhost:3000`.

## Estrutura principal

- `server.js` API e frontend
- `data/` banco JSON
- `uploads/` imagens e arquivos importados
- `public/` interface web responsiva

## Observações

- Esta versão salva os dados em arquivos JSON.
- O reconhecimento por imagem/código está preparado em fluxo manual assistido, sem IA externa.
- A importação aceita CSV/TXT simples com cabeçalho como: `codigo,nome,material,quantidade,endereco`.
