# Pilha no Analisador Sintático

Este documento explica a estrutura de dados **pilha** e todos os pontos em que ela é usada no projeto.

## O que é uma pilha?

Uma pilha guarda elementos seguindo a regra **LIFO** (*Last In, First Out*): o último elemento que entra é o primeiro que sai.

Um exemplo com pratos ajuda a visualizar:

```text
Coloca o prato A: [ A ]
Coloca o prato B: [ A, B ]
Retira um prato:  [ A ]  <- B sai primeiro
```

Em JavaScript, as operações principais são:

```ts
pilha.push(item); // coloca item no topo
pilha.pop();      // retira o item do topo
```

Para os delimitadores de um código, essa regra é necessária porque o último símbolo aberto precisa ser o primeiro fechado. Por exemplo, em `({[]})`, o `[` é o último a abrir; portanto, `]` deve ser o primeiro a fechar.

## Como a pilha é aplicada neste projeto

O sistema verifica três pares de símbolos:

```ts
const pares = { "(": ")", "[": "]", "{": "}" };
```

Essa tabela não é a pilha. Ela apenas informa qual fechamento é esperado para cada abertura. A pilha guarda as aberturas que ainda não foram fechadas.

### 1. A pilha é criada

Na função `analisarCodigo`, em `script.ts`, ela começa vazia:

```ts
const pilha: DelimitadorAberto[] = [];
```

Cada elemento guardado na pilha possui estas informações:

```ts
{
  simbolo: "[",
  indice: 20,
  linha: 2,
  coluna: 5
}
```

Guardar linha e coluna é importante: se o símbolo não for fechado até o final, o sistema sabe exatamente onde ele foi aberto.

### 2. Um símbolo de abertura entra na pilha (`push`)

Enquanto lê o código caractere por caractere, o programa identifica `(`, `[` e `{`:

```ts
if (pares[caractere]) {
  pilha.push({ simbolo: caractere, indice, linha, coluna });
  continue;
}
```

Exemplo para o texto `([`:

```text
Lê (  -> pilha: [ ( ]
Lê [  -> pilha: [ (, [ ]
```

### 3. Um símbolo de fechamento consulta a pilha (`pop`)

Ao encontrar `)`, `]` ou `}`, o código retira a abertura mais recente:

```ts
const abertura = pilha.pop();
```

Exemplo para `([])`:

```text
Pilha antes de ]: [ (, [ ]
pop retira [:     [ ( ]
Pilha antes de ): [ ( ]
pop retira (:     [ ]
```

Depois de cada `pop`, o programa compara o fechamento lido com o valor esperado em `pares`:

```ts
caractere !== pares[abertura.simbolo]
```

Se abriu `[`, o único fechamento válido é `]`.

## Erros que a pilha permite encontrar

### Fechamento sem abertura

Se aparecer `]`, mas a pilha estiver vazia, não existiu `[` antes dele:

```text
Código: ]
Pilha:  [ ]
Erro:   ] sem abertura correspondente
```

No código, `pop()` devolve um valor vazio e o erro é registrado no `if (!abertura)`.

### Fechamento incompatível

Se o topo da pilha é `[` e o texto traz `)`, os símbolos não combinam:

```text
Código: ([)
Pilha antes de ): [ (, [ ]
pop retira [:      [ ( ]
Esperado: ]
Encontrado: )
```

Esse caso é tratado na comparação `caractere !== pares[abertura.simbolo]`. A mensagem informa tanto a posição do fechamento errado quanto a posição da abertura relacionada.

### Abertura sem fechamento

Depois de ler todo o texto, a pilha pode ainda ter elementos. Cada elemento restante representa uma abertura sem o fechamento correspondente:

```ts
for (const abertura of pilha) {
  // registra que falta ), ] ou }
}
```

Exemplo:

```text
Código: function teste() {
Pilha ao terminar: [ { ]
Erro: falta }
```

## Como o erro chega à tela

A função `analisarCodigo` devolve uma lista de erros. Quando a pessoa clica em **Analisar código**, `mostrarResultado()` recebe essa lista e cria um item para cada problema.

Além da mensagem com linha e coluna, `criarIndicadorErro()` copia a linha original do código e posiciona uma seta na coluna do índice armazenado no erro:

```text
1 | function exemplo( {
  |                  ↑ aqui
```

A seta não realiza a análise. Ela usa a posição produzida pela análise com pilha para facilitar a visualização de onde corrigir.

## Detalhe importante: strings e comentários

Antes da pilha analisar o texto, a função `ignorarStringsEComentarios()` troca o conteúdo de strings e comentários por espaços, mantendo as quebras de linha. Assim, símbolos como `{` dentro de uma string não entram na pilha:

```js
const texto = "esta chave { é apenas texto";
```

## Resumo para apresentação

1. A pilha começa vazia.
2. Cada `(`, `[` ou `{` entra com `push`.
3. Cada `)`, `]` ou `}` retira o último aberto com `pop`.
4. O fechamento retirado é comparado com o esperado.
5. Se a pilha estiver vazia em um fechamento, falta uma abertura.
6. Se restarem itens no fim, faltam fechamentos.
7. A posição guardada junto de cada item permite informar linha, coluna e desenhar a seta na tela.
