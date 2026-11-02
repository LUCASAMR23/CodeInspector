# Code Inspector

Aplicação web para análise sintática básica de código JavaScript.

## Recursos

- Destaca palavras reservadas, strings, comentários e números.
- Verifica parênteses, colchetes e chaves com a estrutura de dados **pilha**.
- Identifica o delimitador sem correspondência e informa sua linha e coluna.
- Ignora delimitadores dentro de strings e comentários.

## Como executar

Compile o TypeScript antes de abrir a página:

```bash
tsc.cmd
```

Depois, abra o arquivo `index.html` no navegador. O navegador carrega o `script.js` gerado a partir de `script.ts`.
