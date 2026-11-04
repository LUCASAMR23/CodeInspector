# Analisador Sintático — PRJ.ED.11

Verifica parênteses, colchetes e chaves usando uma pilha, informa posições dos
erros e destaca palavras reservadas de JavaScript. Funciona offline.

## Abrir o projeto

Abra `index.html` no navegador, mantendo `script.js` e `style.css` na mesma pasta.
O JavaScript já está pronto: não é necessário compilar ou instalar dependências
para usar a página no computador do professor.

`script.ts` é o fonte TypeScript desta versão. `script.js` é sua versão para o
navegador. Se editar o TypeScript e tiver o compilador disponível, gere o JavaScript
novamente com `tsc.cmd`. Evite editar os dois arquivos separadamente.

## Organização para estudar

O TypeScript está separado em oito blocos:

1. Tipos dos objetos usados pela análise.
2. Elementos da página.
3. Pares de delimitadores e palavras reservadas.
4. Preparação do texto e formatação de posições.
5. Análise com pilha.
6. Destaque de palavras.
7. Exibição e limpeza do resultado.
8. Eventos e código exibido para a apresentação.

HTML e CSS também estão divididos por responsabilidade. A versão JavaScript
contém os blocos de funcionamento; os tipos só existem no arquivo TypeScript.

## Como a pilha funciona

Cada abertura é empilhada com seus dados:

```js
{ simbolo: "[", indice: 20, linha: 2, coluna: 5 }
```

`indice` é a posição a partir de zero no texto inteiro. Linha e coluna começam
em 1. São dados diferentes: não é necessário percorrer o texto novamente para
descobrir a linha de cada erro.

`push()` insere no topo e `pop()` retira do topo. A última abertura que entrou
deve ser a primeira a fechar: essa é a regra LIFO.

Em `([])`, `(` entra primeiro e `[` entra depois. O `]` retira `[`, e o `)`
retira `(`. A pilha termina vazia.

O objeto `pares` relaciona abertura com fechamento. Ao encontrar um fechamento:

- Se a pilha estiver vazia, existe fechamento sem abertura.
- Se o topo combinar, o par está equilibrado.
- Se não combinar, registramos a posição, o símbolo esperado e a posição da abertura.

Na incompatibilidade, consumimos a abertura do topo e o fechamento como um par
com símbolo trocado. Isso permite continuar procurando problemas sem registrar
novamente a mesma abertura. É uma regra de recuperação simples: em códigos muito
malformados, avisos posteriores ainda podem ser consequência de um erro anterior.

Ao terminar, todas as aberturas restantes também viram erros. A lista final é
ordenada pela posição no código, mantendo o recurso de mostrar vários problemas.

## Strings, comentários e destaque

`ignorarStringsEComentarios()` substitui os caracteres de strings e comentários
por espaços. As quebras de linha são preservadas. A expressão regular está
isolada nessa função para facilitar o estudo do restante do analisador.

Essa cópia serve tanto para verificar delimitadores quanto para encontrar palavras
reservadas. A cópia é preparada uma vez por análise. O destaque é aplicado sobre
o texto original, preservando os comentários e as strings na exibição.

O `Set` guarda a lista de palavras consultadas. As palavras são reconhecidas
inteiras: `if` recebe cor, mas `ifTotal` não. Também destacamos `async`, palavras
contextuais/futuras e os literais `true`, `false` e `null`; o destaque não é uma
análise do papel gramatical de cada palavra.

O texto digitado é exibido com nós de texto e `textContent`, sem `innerHTML` ou
`eval`. O conteúdo digitado nunca é executado.

## Exemplos para a apresentação

| Código | Resultado esperado |
| --- | --- |
| `function exemplo() { return [1, 2]; }` | Nenhum erro de delimitadores; palavras em destaque |
| `const lista = [` | Abertura `[` sem fechamento na linha 1, coluna 15 |
| `([)]` | Incompatibilidades nas colunas 3 e 4 |
| `]` | Fechamento sem abertura na linha 1, coluna 1 |
| `const texto = "([{"; // })]` | Nenhum erro de delimitadores |
| `const numeros = [1, 2, 3);` | Um fechamento incompatível: esperado `]` |

## Perguntas para treinar em dupla

**Por que pilha e não fila?** Uma fila retiraria o primeiro item inserido.
Precisamos retirar o último, pois o fechamento deve respeitar o aninhamento.

**Por que não basta contar os símbolos?** `([)]` tem a quantidade certa de cada
símbolo, mas está na ordem errada. A pilha verifica a ordem.

**Por que guardar linha e coluna na abertura?** Para localizar a abertura mesmo
quando chegarmos ao final do texto sem encontrar seu fechamento.

**O que foi otimizado?** Antes, cada erro copiava o prefixo do código e separava
suas linhas. Agora, linha e coluna são contadas durante uma única leitura. Se
`n` é o tamanho do texto e `e` o número de erros, a leitura é O(n) e a ordenação
final é O(e log e). O espaço usado é O(n) no pior caso.

**A ausência de erros garante JavaScript válido?** Não. `const = ;` não tem
delimitadores sobrando, mas não é uma instrução válida de JavaScript.

## Limites conhecidos

- O projeto verifica delimitadores, não toda a sintaxe de JavaScript.
- Literais de expressão regular `/.../` não são reconhecidos. Seus delimitadores
  ou aspas podem produzir resultados incorretos.
- Crases são tratadas como texto inteiro. Expressões dentro de `${...}` não são
  analisadas. Templates aninhados também exigiriam uma leitura léxica mais completa.
- A função de preparação pode ignorar strings/comentários incompletos até o fim
  do texto; não é um validador desses trechos.
- Colunas usam posições UTF-16, como os índices das strings JavaScript. Uma
  tabulação conta como uma posição e um emoji pode ocupar duas. Quebras LF,
  CRLF e CR são aceitas.
- Identificadores escritos com escapes Unicode não são interpretados pelo destaque.

## Verificação opcional

Se o Node.js já estiver instalado, execute `node testes.js`. Os testes usam apenas
módulos nativos. Eles não são carregados pela página e não exigem instalação de
bibliotecas. Incluem o exemplo da imagem que antes gerava quatro avisos.
