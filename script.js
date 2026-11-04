"use strict";
// Gerado de script.ts. Edite o fonte TypeScript.

// 2. Elementos da página
function obterElemento(id) {
  const elemento = document.getElementById(id);

  if (!elemento) {
    throw new Error(`Elemento #${id} não encontrado.`);
  }

  return elemento;
}

const campoCodigo = obterElemento("codigo");
const botaoAnalisar = obterElemento("botao-analisar");
const painelResultado = obterElemento("painel-resultado");
const resumoResultado = obterElemento("resumo-resultado");
const listaErros = obterElemento("lista-erros");
const painelDestaque = obterElemento("painel-destaque");
const codigoDestacado = obterElemento("codigo-destacado");
const codigoAnalise = obterElemento("codigo-analise");


// 3. Pares de delimitadores e palavras da linguagem
const pares = { "(": ")", "[": "]", "{": "}" };
const palavrasReservadas = new Set([
  "async", "await", "break", "case", "catch", "class", "const", "continue",
  "debugger", "default", "delete", "do", "else", "enum", "export", "extends",
  "false", "finally", "for", "function", "if", "implements", "import", "in",
  "instanceof", "interface", "let", "new", "null", "package", "private",
  "protected", "public", "return", "static", "super", "switch", "this",
  "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield"
]);


// 4. Preparação do texto e formatação das posições
// shortcut: regex e expressões em crases exigem leitura léxica mais completa; ampliar se forem usadas.
function ignorarStringsEComentarios(codigo) {
  const trechosIgnorados = /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\r\n\u2028\u2029]*|"(?:\\[\s\S]|[^"\\])*"?|'(?:\\[\s\S]|[^'\\])*'?|`(?:\\[\s\S]|[^`\\])*`?/g;

  // Espaços mantêm os índices originais; quebras mantêm as linhas originais.
  return codigo.replace(trechosIgnorados, trecho => trecho.replace(/[^\r\n\u2028\u2029]/g, " "));
}

function formatarPosicao(posicao) {
  return `linha ${posicao.linha}, coluna ${posicao.coluna}`;
}


// 5. Análise com pilha: independente dos elementos da página
function analisarCodigo(codigo) {
  const codigoLimpo = ignorarStringsEComentarios(codigo);
  const pilha = [];
  const erros = [];
  let linha = 1;
  let coluna = 0;

  for (let indice = 0; indice < codigoLimpo.length; indice++) {
    const caractere = codigoLimpo[indice];
    coluna++;

    if ("\r\n\u2028\u2029".includes(caractere)) {
      // No Windows, \r\n representa uma única quebra de linha.
      if (caractere === "\r" && codigoLimpo[indice + 1] === "\n") {
        indice++;
      }

      linha++;
      coluna = 0;
      continue;
    }

    if (pares[caractere]) {
      pilha.push({ simbolo: caractere, indice, linha, coluna });
      continue;
    }

    if (!")]}".includes(caractere)) {
      continue;
    }

    const abertura = pilha.pop();
    const posicao = formatarPosicao({ linha, coluna });

    if (!abertura) {
      erros.push({
        mensagem: `“${caractere}” sem abertura correspondente em ${posicao}.`,
        indice
      });
    } else if (caractere !== pares[abertura.simbolo]) {
      // Consumimos o par incompatível para não repetir a mesma abertura como outro erro.
      erros.push({
        mensagem: `“${caractere}” incompatível em ${posicao}. `
          + `Esperado “${pares[abertura.simbolo]}” para “${abertura.simbolo}” `
          + `aberto em ${formatarPosicao(abertura)}.`,
        indice
      });
    }
  }

  for (const abertura of pilha) {
    erros.push({
      mensagem: `“${abertura.simbolo}” sem fechamento correspondente `
        + `em ${formatarPosicao(abertura)}. Esperado “${pares[abertura.simbolo]}”.`,
      indice: abertura.indice
    });
  }

  return {
    erros: erros.sort((primeiro, segundo) => primeiro.indice - segundo.indice),
    codigoLimpo
  };
}


// 6. Destaque de palavras: texto digitado nunca é interpretado como HTML
function destacarPalavras(codigo, codigoLimpo) {
  const fragmento = document.createDocumentFragment();
  const palavras = codigoLimpo.matchAll(/[\p{ID_Continue}$\u200c\u200d]+/gu);
  let inicio = 0;

  for (const palavra of palavras) {
    if (!palavrasReservadas.has(palavra[0])) {
      continue;
    }

    fragmento.append(document.createTextNode(codigo.slice(inicio, palavra.index)));

    const destaque = document.createElement("span");
    destaque.className = "palavra-reservada";
    destaque.textContent = palavra[0];
    fragmento.append(destaque);

    inicio = palavra.index + palavra[0].length;
  }

  fragmento.append(document.createTextNode(codigo.slice(inicio)));
  codigoDestacado.replaceChildren(fragmento);
}


// 7. Exibição do resultado e limpeza ao editar
function limparResultado() {
  painelResultado.className = "resultado neutro";
  resumoResultado.textContent = "Aguardando análise";
  listaErros.replaceChildren();
  listaErros.hidden = true;
  codigoDestacado.replaceChildren();
  painelDestaque.hidden = true;
}

function mostrarResultado() {
  const codigo = campoCodigo.value;
  limparResultado();

  if (codigo.trim() === "") {
    resumoResultado.textContent = "Digite um código para analisar";
    return;
  }

  const analise = analisarCodigo(codigo);
  destacarPalavras(codigo, analise.codigoLimpo);
  painelDestaque.hidden = false;
  painelResultado.className = `resultado ${analise.erros.length ? "erro" : "sucesso"}`;

  if (analise.erros.length === 0) {
    resumoResultado.textContent = "Nenhum erro de delimitadores foi encontrado.";
    return;
  }

  resumoResultado.textContent = analise.erros.length === 1
    ? "1 erro encontrado:"
    : `${analise.erros.length} erros encontrados:`;

  for (const erro of analise.erros) {
    const item = document.createElement("li");
    item.textContent = erro.mensagem;
    listaErros.append(item);
  }

  listaErros.hidden = false;
}


// 8. Eventos e código disponível para explicar durante a apresentação
botaoAnalisar.addEventListener("click", mostrarResultado);
campoCodigo.addEventListener("input", limparResultado);

codigoAnalise.textContent = `const pares = ${JSON.stringify(pares, null, 2)};\n\n`
  + [ignorarStringsEComentarios, formatarPosicao, analisarCodigo]
    .map(funcao => funcao.toString())
    .join("\n\n");
