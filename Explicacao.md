# Explicação simples e completa do projeto

Este projeto recebe um código JavaScript e responde se os símbolos abaixo estão organizados corretamente:

~~~text
(   )
[   ]
{   }
~~~

Por exemplo, isto está correto:

~~~js
if (idade > 18) {
  console.log("Pode entrar");
}
~~~

E isto tem erro:

~~~js
if (idade > 18] {
  console.log("Pode entrar");
}
~~~

O motivo é simples: o parêntese abriu com ( e foi fechado com ]. O correto seria ).

> Os números de linha citados neste texto correspondem ao arquivo script.ts atual. Se você editar o arquivo, eles podem mudar.

## Antes de tudo: o que é uma pilha?

Pense em uma pilha de pratos.

~~~text
Você coloca um prato.
Depois coloca outro prato em cima.
Para retirar um prato, você retira o que está em cima primeiro.
~~~

Em programação, a pilha funciona da mesma forma:

~~~text
push  = colocar um item em cima
pop   = retirar o item que está em cima
~~~

Isso é chamado de LIFO:

~~~text
Last In, First Out
Último a entrar, primeiro a sair
~~~

Para símbolos de código, isso é exatamente o que precisamos. Observe:

~~~js
({[]})
~~~

A ordem é:

~~~text
1. abre (
2. abre {
3. abre [
4. fecha ]  <- precisa fechar [ primeiro
5. fecha }  <- depois fecha {
6. fecha )  <- por último fecha (
~~~

Ou seja: o último símbolo aberto tem de ser o primeiro símbolo fechado. Por isso usamos pilha, e não fila.

Uma fila faria o contrário:

~~~text
Primeiro a entrar, primeiro a sair
~~~

Ela tentaria fechar ( antes de [, o que estaria errado.

## O caminho completo do programa

Quando alguém usa a página, acontece isto:

~~~text
1. A pessoa digita ou cola um código.
2. O programa mostra o código com cores.
3. A pessoa clica no botão Analisar código.
4. O programa procura todos os símbolos de abertura e fechamento.
5. Os erros aparecem em uma lista.
~~~

No arquivo script.ts:

~~~text
Linha 438: escuta o clique no botão.
Linha 390: começa a função que mostra o resultado.
Linha 401: chama a função que realmente analisa o código.
Linha 151: começa a função principal da pilha.
~~~

## Parte 1: os tipos de informação — linhas 1 a 36

No começo do arquivo existem sete interfaces. Interface é apenas uma forma de dizer ao TypeScript quais informações um objeto precisa ter.

### Posicao — linhas 2 a 5

~~~ts
interface Posicao {
  linha: number;
  coluna: number;
}
~~~

Ela guarda onde algo apareceu no código.

Exemplo:

~~~text
linha: 3
coluna: 10
~~~

Isso permite o programa avisar onde está o erro.

### DelimitadorAberto — linhas 7 a 10

~~~ts
interface DelimitadorAberto extends Posicao {
  simbolo: string;
  indice: number;
}
~~~

Um delimitador é um símbolo que marca alguma coisa. Neste projeto, os delimitadores são:

~~~text
(  [  {  )  ]  }
~~~

DelimitadorAberto representa um símbolo que abriu e ainda espera por um fechamento. Ele guarda:

| Informação | Exemplo | Para que serve |
|---|---|---|
| simbolo | { | Saber o que foi aberto |
| indice | 25 | Guardar a posição no texto inteiro |
| linha | 2 | Informar a linha |
| coluna | 8 | Informar a coluna |

A palavra extends significa que DelimitadorAberto também possui linha e coluna, porque reaproveita Posicao.

### Erro — linhas 12 a 15

~~~ts
interface Erro extends Posicao {
  mensagem: string;
  indice: number;
}
~~~

Cada problema encontrado vira um objeto Erro. A mensagem será mostrada na tela e o índice ajuda a deixar os erros na ordem certa.

### Analise — linhas 17 a 20

~~~ts
interface Analise {
  erros: Erro[];
  codigoLimpo: string;
}
~~~

O resultado da análise possui uma lista de erros e o código sem strings e comentários. As interfaces auxiliares IndicadorErro (22 a 25), StringIncompleta (27 a 30) e NomesDefinidos (32 a 36) descrevem o indicador visual, o trecho incompleto e os nomes reconhecidos.

O sinal [] quer dizer lista. Assim:

~~~text
Erro[] = lista de erros
~~~

## Parte 2: pegar as partes da página — linhas 38 a 57

O HTML é a estrutura da página: caixa de texto, botão e painel de resultado. O TypeScript precisa encontrar esses elementos para usá-los.

~~~ts
function obterElemento<T extends HTMLElement>(id: string): T {
  const elemento = document.getElementById(id);

  if (!elemento) {
    throw new Error(...);
  }

  return elemento as T;
}
~~~

Essa função está nas linhas 39 a 47.

Ela faz três coisas:

1. Linha 40: procura no HTML um elemento pelo id.
2. Linhas 42 a 44: se não encontrar, mostra erro. Isso evita o programa continuar quebrado.
3. Linha 46: devolve o elemento encontrado.

Depois, nas linhas 49 a 57, o programa guarda os elementos importantes:

| Linha | Nome | O que é |
|---:|---|---|
| 49 | campoCodigo | Caixa onde o usuário escreve |
| 50 | botaoAnalisar | Botão para começar a análise |
| 51 | painelResultado | Caixa grande do resultado |
| 52 | resumoResultado | Texto com resumo |
| 53 | listaErros | Lista onde os erros aparecem |
| 54 a 56 | editor e destaque | Partes que deixam o código colorido |
| 57 | codigoAnalise | Área que mostra o código explicado |

## Parte 3: saber quais símbolos combinam — linha 60

~~~ts
const pares: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}"
};
~~~

Pense nisso como uma pequena tabela de respostas:

~~~text
Se abriu ( , precisa fechar )
Se abriu [ , precisa fechar ]
Se abriu { , precisa fechar }
~~~

Essa tabela é usada em dois momentos muito importantes:

1. Linha 186: descobrir se um caractere é abertura.
2. Linha 205: descobrir se o fechamento encontrado é o correto.

## Parte 4: ignorar textos e comentários — linhas 61 e 94 a 97

Veja este código:

~~~js
const mensagem = "Esta chave { não é código";
// Este parêntese ( também não é código
~~~

Os símbolos dentro da string e do comentário não devem contar como abertura. Caso contassem, o programa acusaria erros que não existem.

A linha 61 cria um padrão que reconhece:

~~~text
// comentário de uma linha
/* comentário de várias linhas */
"texto entre aspas"
'texto entre aspas simples'
`texto entre crases`
~~~

Depois, a função das linhas 94 a 97 troca todo o conteúdo reconhecido por espaços:

~~~ts
function ignorarStringsEComentarios(codigo: string): string {
  return codigo.replace(
    padraoTextos,
    trecho => trecho.replace(/[^\r\n\u2028\u2029]/g, " ")
  );
}
~~~

Ela não apaga completamente o texto; substitui por espaços. Assim, a posição dos outros símbolos não muda.

Exemplo:

~~~text
Antes:  const x = "{";
Depois:  const x =    ;
~~~

A chave fica fora da análise, mas as colunas do restante continuam iguais.

## Parte 5: começar a análise — linhas 151 a 157

~~~ts
function analisarCodigo(codigo: string): Analise {
  const stringIncompleta = encontrarStringIncompleta(codigo);
  const codigoLimpo = ignorarStringsEComentarios(codigo);
  const pilha: DelimitadorAberto[] = [];
  const erros: Erro[] = [];
  let linha = 1;
  let coluna = 0;
}
~~~

Vamos entender uma linha de cada vez:

| Linha | O que faz |
|---:|---|
| 151 | Cria a função que fará a análise |
| 152 | Procura strings ou comentários sem fechamento |
| 153 | Faz uma cópia do código sem strings e comentários |
| 154 | Cria a pilha vazia |
| 155 | Cria a lista vazia de erros |
| 156 | Começa a contar pela linha 1 |
| 157 | Começa a contar pela coluna 0 |

## Parte 6: ler o código letra por letra — linhas 159 a 193

~~~ts
for (let indice = 0; indice < codigoLimpo.length; indice++) {
  const caractere = codigoLimpo[indice];
  coluna++;
}
~~~

O for é uma repetição. Ele visita cada caractere do começo ao fim:

~~~text
código:  ( [ ] )
posição: 0 1 2 3
~~~

- indice: posição do caractere no texto completo;
- caractere: símbolo que está sendo visto agora;
- coluna: posição dentro da linha.

### Quando encontra uma nova linha — linhas 163 a 172

Se encontrar Enter, o programa:

1. aumenta o número da linha;
2. volta a coluna para zero;
3. continua a leitura.

Isso é necessário para a mensagem dizer exatamente onde está o problema.

Nas linhas 174 a 184, um texto ou comentário incompleto gera um erro e encerra a análise para evitar avisos derivados desse trecho.

## Parte 7: onde a abertura é colocada na pilha — linhas 186 a 189

~~~ts
if (pares[caractere]) {
  pilha.push({ simbolo: caractere, indice, linha, coluna });
  continue;
}
~~~

Esta é uma das partes mais importantes.

A linha 186 pergunta: o caractere atual é uma chave dentro de pares? Se for, então ele é uma abertura:

~~~text
( ou [ ou {
~~~

A linha 187 usa push:

~~~ts
pilha.push(...)
~~~

Push significa colocar no topo da pilha.

Exemplo com o código:

~~~js
({
~~~

Passo a passo:

~~~text
Encontra (
Pilha fica: (

Encontra {
Pilha fica: ( {
~~~

O continue na linha 188 diz: esta abertura já foi tratada; não precisa verificar mais nada nela.

## Parte 8: descobrir se o símbolo é fechamento — linhas 191 a 193

~~~ts
if (!")]}".includes(caractere)) {
  continue;
}
~~~

Agora o programa pergunta:

~~~text
O caractere é ) ou ] ou }?
~~~

Se não for, ele não tem relação com a pilha e é ignorado.

## Parte 9: onde tira da pilha — linha 195

~~~ts
const abertura = pilha.pop();
~~~

Pop significa retirar o último item colocado na pilha.

Exemplo:

~~~text
Pilha antes: ( { [
Encontra: ]
pop retira: [
Pilha depois: ( {
~~~

Por que retira o último?

Porque [ foi o último a abrir. Portanto, ] precisa fechá-lo antes de qualquer outro símbolo.

Se fosse retirada uma abertura antiga, como (, o código ficaria errado. É por isso que usamos pilha.

## Parte 10: onde verifica se abriu e fechou certo — linhas 196 a 215

~~~ts
const posicao = formatarPosicao({ linha, coluna });
~~~

Linha 196 monta a posição do fechamento encontrado, por exemplo linha 4, coluna 7.

### Caso 1: não existe abertura — linhas 198 a 204

~~~ts
if (!abertura) {
  erros.push({
    mensagem: ...,
    indice
  });
}
~~~

Se a pilha estiver vazia, pop não consegue tirar nada. Isso significa que apareceu um fechamento sem abertura.

Exemplo:

~~~js
}
~~~

Não existe { antes dele. A linha 199 usa erros.push para guardar a mensagem.

### Caso 2: abertura e fechamento diferentes — linhas 205 a 215

~~~ts
else if (caractere !== pares[abertura.simbolo]) {
  erros.push({
    mensagem: ...,
    indice
  });
}
~~~

Esta é a comparação principal do exercício.

Se a abertura retirada foi [, o programa procura:

~~~ts
pares["["]
~~~

O resultado é ].

Então:

~~~text
Se encontrou ]: está correto.
Se encontrou ): está errado.
Se encontrou }: está errado.
~~~

Exemplo completo com erro:

~~~js
([)
~~~

~~~text
1. ( entra na pilha
   Pilha: (

2. [ entra na pilha
   Pilha: ( [

3. ) aparece
   pop retira [

4. O programa verifica:
   ) é igual ao fechamento esperado para [ ?
   Não. O esperado era ].

5. A linha 207 guarda um erro na lista.
~~~

### Caso 3: par correto

Se a abertura era [ e o símbolo atual é ], a comparação não encontra problema. Não adiciona erro porque o pop já retirou [ da pilha corretamente.

## Parte 11: aberturas que ficaram sem fechar — linhas 218 a 226

Depois de ler o código inteiro, ainda podem sobrar itens na pilha.

~~~ts
for (const abertura of pilha) {
  erros.push({
    mensagem: ...,
    indice: abertura.indice
  });
}
~~~

Exemplo:

~~~js
function teste() {
~~~

Passo a passo:

~~~text
1. ( entra e ) o fecha corretamente.
2. { entra na pilha.
3. O código termina.
4. Não apareceu }.
5. { continua na pilha.
6. A linha 219 cria o erro: falta }.
~~~

Finalmente, as linhas 228 a 231 retornam o código limpo e os erros ordenados pela posição em que aparecem no código.

## Parte 12: mostrar o código colorido — linhas 236 a 357

Essa parte não muda a análise da pilha. Ela existe só para facilitar a leitura.

| Linhas | O que fazem |
|---:|---|
| 236 a 321 | Reconhecem nomes definidos e suas referências |
| 327 | Procuram textos, números e palavras |
| 329 a 335 | Escolhem a cor de cada trecho |
| 336 e 343 | Adicionam texto normal |
| 337 a 340 | Criam um trecho colorido |
| 339 | Usam textContent, que mostra o código como texto seguro |
| 347 a 352 | Aplicam o destaque reutilizável ao editor |
| 354 a 357 | Mantêm o destaque na mesma rolagem da caixa de texto |

## Parte 13: mostrar resultados — linhas 375 a 435

### Limpar resultado — linhas 375 a 380

Antes de digitar ou analisar de novo, limparResultado apaga erros antigos e escreve Aguardando análise.

### Ao digitar — linhas 382 a 388

atualizarEditor é chamada enquanto a pessoa digita:

~~~text
Limpa o resultado antigo
Atualiza as cores do código
Alinha a rolagem
Atualiza os contadores de linhas e caracteres
~~~

Ela ainda não faz a análise, apenas prepara a tela.

### Ao clicar no botão — linhas 390 a 435

mostrarResultado faz o trabalho final:

1. Linha 391: pega o texto digitado.
2. Linha 394: verifica se o campo está vazio.
3. Linha 401: chama analisarCodigo, onde está a pilha.
4. Linha 404: deixa o painel vermelho se há erro ou verde se não há.
5. Linhas 406 a 409: mostra sucesso se a lista estiver vazia.
6. Linhas 415 a 432: cria um item na tela para cada erro encontrado, com a linha e uma seta indicando o local.

## Parte 14: eventos e apresentação — linhas 437 a 549

~~~ts
botaoAnalisar.addEventListener("click", mostrarResultado);
campoCodigo.addEventListener("input", atualizarEditor);
campoCodigo.addEventListener("scroll", sincronizarRolagem);
~~~

Essas linhas dizem quando cada função deve acontecer:

- linha 438: clicou no botão, analisa;
- linha 439: digitou, atualiza o editor;
- linha 440: rolou o texto, alinha o destaque;
- linhas 443 a 448: analisam com Ctrl+Enter ou Cmd+Enter;
- linhas 457 a 473: carregam exemplos ou limpam o editor;
- linhas 477 a 499: configuram a cópia segura, ativada nas linhas 532 e 533;
- linhas 501 a 530: apresentam o algoritmo reutilizando criarDestaque;
- linhas 535 e 536: iniciam o editor quando a página abre;
- linhas 538 a 549: montam e mostram os trechos de código ligados à análise.

## Resumo para decorar

| Pergunta | Resposta no código |
|---|---|
| Onde cria a pilha? | Linha 154 |
| Onde adiciona abertura? | Linha 187: pilha.push |
| Onde retira abertura? | Linha 195: pilha.pop |
| Onde compara se está correto? | Linha 205 |
| Onde guarda erro de fechamento sem abertura? | Linha 199 |
| Onde guarda erro de abertura sem fechamento? | Linha 219 |
| Por que usa pilha? | Porque o último símbolo aberto deve ser o primeiro a fechar |
