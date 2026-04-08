# Documento de Arquitetura - Teste Técnico Areco

Este documento define as decisões arquiteturais e tecnológicas estabelecidas para o desenvolvimento da aplicação de gestão de produtos. As escolhas visam maximizar a manutenibilidade, a experiência do desenvolvedor (DX) e o cumprimento estrito das regras de negócio exigidas.

## 1. Stack Tecnológico Principal

* [cite_start]**Back-end:** C# com ASP.NET Core Web API[cite: 3].
* [cite_start]**Front-end:** React[cite: 8].
* [cite_start]**Base de Dados:** SQLite[cite: 4].

## 2. Decisões Arquiteturais e Padrões

### 2.1. Padrão Arquitetural
Foi adotada a **Clean Architecture**. [cite_start]Esta estrutura garante o isolamento absoluto das regras de negócio, separação clara de responsabilidades e facilita futuras manutenções[cite: 2, 15].

### 2.2. Acesso a Dados (ORM)
Utilização do **Entity Framework Core (EF Core)** com a abordagem *Code-First*. As *Migrations* serão aplicadas automaticamente na inicialização da aplicação para configurar o banco de dados SQLite, eliminando atritos na configuração do ambiente de testes.

### 2.3. Injeção de Dependência
Gerenciamento realizado exclusivamente pelo contêiner nativo do ASP.NET Core (`Microsoft.Extensions.DependencyInjection`). A ferramenta nativa é robusta o suficiente para lidar com os ciclos de vida (Scoped, Transient, Singleton) sem a necessidade de bibliotecas de terceiros.

## 3. Tratamento de Dados e Comunicação

### 3.1. Objetos de Transferência e Validação
[cite_start]Haverá separação rigorosa entre as entidades de domínio e os objetos de transferência (DTOs)[cite: 16]. A validação dos DTOs será implementada utilizando **FluentValidation**, garantindo que as classes permaneçam puras e as regras de validação fiquem isoladas.

### 3.2. Paginação
[cite_start]A paginação obrigatória na listagem de produtos [cite: 6] será retornada através de um envelope no corpo da resposta JSON (ex: `PagedResult<T>`). Esta abordagem simplifica o consumo pela interface de usuário e evita configurações adicionais de CORS para exposição de cabeçalhos.

### 3.3. Tratamento de Erros
Implementação de um **Middleware Global de Exceções**. [cite_start]Este componente centralizará a captura de falhas, garantindo que o Front-end receba respostas padronizadas (formato *Problem Details*) e adequadas para qualquer erro ou violação de regra de negócio[cite: 17].

## 4. Regras de Negócio e Integridade

### 4.1. Unicidade de SKU
[cite_start]O sistema garantirá que cada código identificador (SKU) seja único[cite: 13, 14]. Foi definida uma estratégia de defesa em profundidade:
1.  **Camada de Aplicação:** Validação prévia no repositório para retorno amigável de erro.
2.  **Base de Dados:** Aplicação de *Constraint* de Índice Único (*Unique Index*) via EF Core para prevenir concorrência simultânea (*race conditions*).

## 5. Observabilidade

### 5.1. Sistema de Logs
[cite_start]Os logs da aplicação registrarão eventos de criação, atualização e exclusão, além de erros de validação e exceções[cite: 7, 8]. Será utilizada a biblioteca **Serilog** em uma abordagem híbrida:
1.  **Console:** Para feedback visual imediato durante a avaliação técnica.
2.  **Arquivo de Texto Físico:** Para persistência do histórico estruturado, desacoplado do banco de dados relacional.