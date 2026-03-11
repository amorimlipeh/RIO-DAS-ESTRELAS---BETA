# SISTEMA DE ESTOQUE ✨ RIO DAS ESTRELAS 🌟

Sistema web de estoque com endereçamento logístico integrado, pedidos, separação, inventário, alertas e notificações.

## Como rodar localmente

```bash
npm install
npm start
```

Acesse: `http://localhost:3000`

## Credenciais iniciais

- Usuário: `admin`
- Senha: `123456`

## Estrutura principal

- `public/` interface web
- `routes/` rotas da API
- `modules/` regras de negócio
- `data/` banco JSON
- `uploads/` arquivos enviados
- `backups/` backups gerados pelo sistema

## Observação

O projeto já nasce com modo manual, automático e misto para várias operações, configurado em `data/configuracoes.json`.
