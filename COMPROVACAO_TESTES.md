# Comprovacao de Implementacao e Testes

## Escopo implementado nesta etapa

Itens solicitados e concluidos:

1. Logs de aplicacao e de requisicoes (Serilog + logs de negocio em create/update/delete).
2. Frontend com CRUD real de produtos via API (POST/PUT/DELETE), com exibicao de mensagens de erro retornadas pelo backend.
3. Middleware global de excecoes padronizando respostas de erro.
4. Inicializacao por migrations EF Core (substituindo EnsureCreated), incluindo compatibilidade com banco SQLite legado.

README ficou propositalmente fora desta etapa, conforme prioridade definida.

## Mudancas tecnicas principais

- API:
  - Serilog configurado no host e no pipeline.
  - GlobalExceptionMiddleware criado e registrado.
  - Program.cs migrado para Database.MigrateAsync().
  - Baseline automatico para banco legado (quando Products existe e historico de migration ainda nao existe).
- Application:
  - ProductService com ILogger e logs estruturados para create/update/delete e rejeicoes de regra.
- Infrastructure:
  - Migrations EF Core geradas em Loja.Infrastructure/Data/Migrations.
- Frontend:
  - Dashboard.tsx atualizado para usar chamadas reais:
    - POST /api/products
    - PUT /api/products/{id}
    - DELETE /api/products/{id}
  - Parse de erro da API (errors/detail/title) e exibicao no card de erro da pagina.

## Verificacao executada

## 1) Build backend

Comando executado:

```powershell
dotnet build .\Loja.sln
```

Resultado:
- Compilacao com sucesso.
- 0 erros.

## 2) Build frontend

Comando executado:

```powershell
Set-Location .\loja-ui
npm run build
```

Resultado:
- Build Vite/TypeScript concluido com sucesso.

## 3) Validacao de startup por migrations

Comportamento validado:

1. API sobe com `Database.MigrateAsync()`.
2. Em banco legado (criado anteriormente por EnsureCreated), o baseline automatico registra a migration inicial e evita erro de tabela ja existente.

Log observado:

- `Seeded EF migration history with baseline migration ...`
- `No migrations were applied. The database is already up to date.`

## 4) Validacao de CRUD + erros padronizados

Foram executadas chamadas reais na API para:

- Criar produto (201)
- Atualizar produto (200)
- Excluir produto (204)
- Forcar erro de validacao (400 com campo `errors`)
- Forcar erro de regra de negocio (400 com `detail`)

Evidencias observadas:

- Criacao/atualizacao/exclusao:
  - `CREATED_ID=<guid>`
  - `UPDATED_NAME=Probe Product Updated`
- Erro de validacao (exemplo):
  - `title: One or more validation errors occurred.`
  - `errors.Sku[]` e `errors.Name[]` preenchidos
- Erro de regra de negocio por SKU duplicado (exemplo):
  - `title: Business rule validation failed.`
  - `detail: Ja existe um produto cadastrado com este SKU.`

## 5) Validacao de logs de aplicacao

Arquivo verificado:

- `Loja.Api/logs/loja-api-dev-YYYYMMDD.log`

Entradas confirmadas:

- `Product created...`
- `Product updated...`
- `Product deleted...`
- `Product creation rejected because SKU ... already exists.`
- Logs de middleware para violacoes de validacao/regra de negocio.

## Como reproduzir rapidamente

1. Subir API:

```powershell
Set-Location .\Loja.Api
dotnet run
```

2. Subir frontend:

```powershell
Set-Location .\loja-ui
npm run dev
```

3. No frontend (Dashboard > Products):
- Add Product: deve persistir no backend.
- Edit Product: deve atualizar no backend.
- Delete Product: deve remover no backend.
- Tentar SKU duplicado: deve aparecer mensagem de erro retornada pela API.
- Tentar Electronics com preco abaixo do minimo: deve aparecer erro de validacao/regra retornado pela API.

4. Conferir logs:
- Abrir `Loja.Api/logs/loja-api-dev-*.log` e confirmar eventos.

## Observacoes

- Existe arquivo local de banco de desenvolvimento (`Loja.Api/loja.dev.db`) no ambiente local.
- O lint do frontend possui erros pre-existentes em regras de hooks/fast-refresh fora do escopo desta entrega; build de producao segue funcionando.
