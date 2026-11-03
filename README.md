# Analisador Sintático

Aplicação web que verifica parênteses, colchetes e chaves em códigos JavaScript.

## Como a análise funciona

O projeto usa uma **pilha**, porque o último delimitador aberto é sempre o primeiro que precisa ser fechado.

1. Ao encontrar uma abertura (`(`, `[` ou `{`), o item é inserido na pilha com `pilha.push({ caractere, indice })`.
2. Ao encontrar um fechamento (`)`, `]` ou `}`), o programa consulta o último item da pilha: `pilha[pilha.length - 1]`.
3. Se os dois combinam, esse último item é removido com `pilha.pop()`.
4. Se não combinam, o fechamento não possui uma abertura válida e o erro é salvo na lista `erros`.
5. Ao terminar de ler o código, tudo que ainda está na pilha é uma abertura sem fechamento. Cada item restante também vira um erro.

Antes da verificação, strings e comentários são substituídos por espaços. Assim, caracteres como `{` dentro de uma string não geram erro. Os espaços mantêm os índices originais, permitindo informar linha e coluna corretas.

### Fila x pilha

Uma **fila** remove o primeiro item inserido (FIFO: primeiro a entrar, primeiro a sair). Ela não é adequada aqui: em `({[]})`, o último delimitador aberto (`[`) deve ser o primeiro a fechar.

Por isso a **pilha** é a estrutura correta (LIFO: último a entrar, primeiro a sair): `(` entra antes de `[`, mas `]` precisa ser verificado antes de `)`.

## Como executar

```bash
tsc.cmd
```

Depois, abra `index.html` no navegador. Ele usa o arquivo `script.js` gerado a partir de `script.ts`.
