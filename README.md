# Analisador Sintático — PRJ.ED.11

Verifica parênteses, colchetes e chaves usando uma pilha, informa posições dos
erros e destaca palavras reservadas de JavaScript. Funciona offline.

## Abrir o projeto

Abra `index.html` no navegador, mantendo `script.js` e `style.css` na mesma pasta.
O JavaScript já está pronto: não é necessário compilar ou instalar dependências
para usar a página no computador do professor.

Palavras reservadas ficam amarelas, números azuis, strings verdes e os booleanos
`true` e `false` ficam roxos. Identificadores (nomes de variáveis, funções,
parâmetros, classes e propriedades) ficam rosas no próprio campo
enquanto você digita ou cola. Strings incluem as aspas que as delimitam.
A string só recebe verde depois que as aspas são fechadas. Enquanto estiver
incompleta, seu conteúdo fica na cor normal, sem outros destaques internos.
O botão “Analisar código” verifica os delimitadores e apresenta os erros.
Para cada erro identificado, além da mensagem com linha e coluna, um indicador
visual exibe a linha do código com uma seta (`↑ aqui`) apontando diretamente
para o caractere problemático.

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
6. Destaque de palavras no campo e sincronização da rolagem.
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

Essa cópia é preparada uma vez por análise e usada na verificação dos delimitadores.
O destaque percorre o texto original, reconhecendo comentários e strings antes
dos números e palavras. A regra de reconhecimento desses textos é compartilhada
com a análise. Assim, números e palavras dentro de strings mantêm a cor da string,
e o conteúdo dos comentários mantém a cor normal.

`destacarCodigo()` escolhe uma classe CSS para cada trecho: `palavra-reservada`,
`numero`, `string`, `booleano` ou `identificador`. O CSS define as cinco cores. Números incluem inteiros,
decimais, notação científica e bases hexadecimal, binária e octal. Esse destaque
não verifica se o literal numérico é válido em toda a gramática de JavaScript.

O `Set` guarda a lista de palavras consultadas. As palavras são reconhecidas
inteiras: `if` recebe cor, mas `ifTotal` não. Também destacamos `async`, palavras
contextuais/futuras e o literal `null`. Os literais `true` e `false` têm uma cor
própria para valores booleanos; o destaque não é uma
análise do papel gramatical de cada palavra.

`encontrarNomesDefinidos()` reconhece declarações usuais de variáveis, funções,
classes, parâmetros e propriedades definidas no próprio código. Esses nomes e
suas referências recebem a classe `identificador`. APIs prontas como `console.log`,
`Math.max` e `document.querySelector` mantêm a cor normal.

Os acessos após ponto são tratados separadamente. Uma função local chamada `log`
não colore o método de `console.log`. Uma propriedade definida pelo usuário,
como `pessoa.nome` após `const pessoa = {nome: "Ana"}`, recebe a cor rosa.

Esse reconhecimento usa padrões simples, sem resolver escopos ou tipos. Sintaxes
mais complexas, como declarações multilinha, desestruturações aninhadas, valores
padrão com chamadas e cadeias de propriedades, podem não ser reconhecidas.

O texto digitado é exibido com nós de texto e `textContent`, sem `innerHTML` ou
`eval`. O conteúdo digitado nunca é executado.

O editor tem um único campo visível. O `textarea` mantém a digitação, a seleção
e o cursor nativos. Uma camada `pre`, sobreposta atrás dele, desenha o mesmo texto
com as cores. Essa camada é ignorada por leitores de tela. O evento `input`
atualiza o destaque e o evento `scroll` mantém a rolagem alinhada. Fontes,
espaçamentos e quebras são iguais nas duas camadas; linhas longas usam rolagem
horizontal. Uma linha em branco extra na camada visual permite acompanhar a
rolagem até o fim sem acrescentar caracteres ao código digitado.

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
suas linhas. Agora, linha e coluna são contadas durante uma única leitura O(n) e
armazenadas diretamente em cada objeto de erro, evitando recalcular posições.
O indicador visual de erro (`criarIndicadorErro`) obtém o snippet da linha sem
reprocessar o texto. As expressões regulares de identificadores foram compiladas
uma única vez no escopo global e o código limpo é reaproveitado entre análise e
destaque, garantindo digitação e análise com máxima performance. Se
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
- Strings com aspas simples ou duplas terminam na quebra de linha, exceto quando
  a quebra é escapada com barra invertida. Crases permitem múltiplas linhas.
- Uma string sem fechamento é apontada na posição da aspa de abertura. A análise
  continua nas próximas linhas e lista também as aberturas pendentes. Em código
  malformado, alguns avisos podem ser consequência de erros anteriores.
- Comentários de bloco incompletos ainda podem ser ignorados até o fim do texto.
- Colunas usam posições UTF-16, como os índices das strings JavaScript. Uma
  tabulação conta como uma posição e um emoji pode ocupar duas. Quebras LF,
  CRLF e CR são aceitas.
- Identificadores escritos com escapes Unicode não são interpretados pelo destaque.

## Verificação opcional

Se o Node.js já estiver instalado, execute `node testes.js`. Os testes usam apenas
módulos nativos. Eles não são carregados pela página e não exigem instalação de
bibliotecas. Incluem o exemplo da imagem que antes gerava quatro avisos.
