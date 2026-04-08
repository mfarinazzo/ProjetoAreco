# Padrão de Commits

Este documento estabelece as normas para a formatação das mensagens de commit no projeto, visando a legibilidade, automação e rastreabilidade do histórico de alterações.

## Estrutura

As mensagens de commit devem seguir o seguinte formato:

<tipo>(<escopo opcional>): <descrição curta>

## Diretrizes de Escrita

1.  **Modo Imperativo:** A descrição deve ser iniciada com um verbo no imperativo (ex: "adiciona", "corrige", "implementa").
2.  **Letras Minúsculas:** O tipo, o escopo e a descrição devem ser escritos integralmente em minúsculas.
3.  **Pontuação:** Não utilizar ponto final ao término da descrição.
4.  **Extensão:** A linha de assunto não deve ultrapassar 72 caracteres.

## Tipos de Commit

| Tipo | Descrição |
| :--- | :--- |
| `feat` | Implementação de uma nova funcionalidade ou requisito. |
| `fix` | Correção de bugs ou comportamentos inesperados. |
| `refactor` | Alterações de código que não corrigem erros nem adicionam funcionalidades (ex: melhoria de performance, limpeza de código). |
| `docs` | Alterações exclusivamente em ficheiros de documentação. |
| `style` | Ajustes de formatação, indentação ou estilo visual que não afetam a lógica. |
| `test` | Adição ou modificação de testes automatizados. |
| `chore` | Manutenção de configurações de build, dependências ou ferramentas de suporte. |

## Exemplos Aplicados

* `feat(api): implementa validacao de estoque minimo`
* `fix(domain): corrige calculo de preco para categoria eletronicos`
* `refactor(infra): extrai configuracao de logging para classe especializada`
* `docs: atualiza guia de execucao no readme`
* `chore: adiciona pacote nuget do entity framework core`