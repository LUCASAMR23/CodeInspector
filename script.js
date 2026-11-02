const campoCodigo = document.getElementById("codigo");
const camadaRealce = document.getElementById("codigo-realce");
const preRealce = document.getElementById("realce");
const botaoAnalisar = document.getElementById("botao-analisar");
const botaoLimpar = document.getElementById("botao-limpar");
const resultadoAnalise = document.getElementById("resultado");
const painelResultado = document.getElementById("painel-resultado");
const iconeResultado = painelResultado.querySelector(".resultado-icone");
const posicaoCursor = document.getElementById("posicao-cursor");

const palavrasReservadas = new Set([
  "async", "await", "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "export", "extends", "finally", "for", "function",
  "if", "import", "in", "instanceof", "let", "new", "of", "return", "static", "super",
  "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"
]);
const pares = { ")": "(", "]": "[", "}": "{" };
const aberturas = new Set(Object.values(pares));

function escaparHtml(texto) {
  return texto.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function realcarCodigo(codigo) {
  const padrao = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(\b[A-Za-z_$][\w$]*\b)|(\b\d+(?:\.\d+)?\b)/g;
  let ultimoIndice = 0;
  let resultado = "";
  for (const ocorrencia of codigo.matchAll(padrao)) {
    resultado += escaparHtml(codigo.slice(ultimoIndice, ocorrencia.index));
    const [trecho, literal, palavra, numero] = ocorrencia;
    if (literal) {
      const classe = literal.startsWith("/") ? "comentario" : "string";
      resultado += `<span class="${classe}">${escaparHtml(trecho)}</span>`;
    } else if (palavra && palavrasReservadas.has(palavra)) {
      resultado += `<span class="palavra-reservada">${palavra}</span>`;
    } else if (numero) {
      resultado += `<span class="numero">${numero}</span>`;
    } else {
      resultado += escaparHtml(trecho);
    }
    ultimoIndice = ocorrencia.index + trecho.length;
  }
  camadaRealce.innerHTML = resultado + escaparHtml(codigo.slice(ultimoIndice)) + "\n";
}

function posicaoNoTexto(texto, indice) {
  const antes = texto.slice(0, indice);
  return { linha: antes.split("\n").length, coluna: indice - antes.lastIndexOf("\n") };
}

function formatarPosicao(posicao) {
  return `linha ${posicao.linha}, coluna ${posicao.coluna}`;
}

function analisarSintaxe(codigo) {
  const pilha = [];
  let estado = "normal";
  for (let indice = 0; indice < codigo.length; indice += 1) {
    const caractere = codigo[indice];
    const proximo = codigo[indice + 1];
    if (estado === "linha") {
      if (caractere === "\n") estado = "normal";
      continue;
    }
    if (estado === "bloco") {
      if (caractere === "*" && proximo === "/") { estado = "normal"; indice += 1; }
      continue;
    }
    if (estado === "aspas-simples" || estado === "aspas-duplas" || estado === "template") {
      if (caractere === "\\") { indice += 1; continue; }
      if ((estado === "aspas-simples" && caractere === "'") || (estado === "aspas-duplas" && caractere === '"') || (estado === "template" && caractere === "`")) estado = "normal";
      continue;
    }
    if (caractere === "/" && proximo === "/") { estado = "linha"; indice += 1; continue; }
    if (caractere === "/" && proximo === "*") { estado = "bloco"; indice += 1; continue; }
    if (caractere === "'") { estado = "aspas-simples"; continue; }
    if (caractere === '"') { estado = "aspas-duplas"; continue; }
    if (caractere === "`") { estado = "template"; continue; }
    if (aberturas.has(caractere)) { pilha.push({ caractere, indice }); continue; }
    if (pares[caractere]) {
      const abertura = pilha[pilha.length - 1];
      if (!abertura || abertura.caractere !== pares[caractere]) {
        return { valido: false, mensagem: `“${caractere}” sem abertura correspondente em ${formatarPosicao(posicaoNoTexto(codigo, indice))}.` };
      }
      pilha.pop();
    }
  }
  if (pilha.length > 0) {
    const abertura = pilha[pilha.length - 1];
    return { valido: false, mensagem: `“${abertura.caractere}” sem fechamento correspondente em ${formatarPosicao(posicaoNoTexto(codigo, abertura.indice))}.` };
  }
  return { valido: true, mensagem: "Nenhuma expressão malformada foi encontrada." };
}

function atualizarResultado(analise) {
  painelResultado.className = `painel-resultado ${analise.valido ? "sucesso" : "erro"}`;
  iconeResultado.textContent = analise.valido ? "✓" : "!";
  resultadoAnalise.textContent = analise.mensagem;
}
function atualizarCursor() {
  const posicao = posicaoNoTexto(campoCodigo.value, campoCodigo.selectionStart);
  posicaoCursor.textContent = `Linha ${posicao.linha}, coluna ${posicao.coluna}`;
}
function sincronizarEditor() {
  realcarCodigo(campoCodigo.value);
  preRealce.scrollTop = campoCodigo.scrollTop;
  preRealce.scrollLeft = campoCodigo.scrollLeft;
  atualizarCursor();
}

botaoAnalisar.addEventListener("click", () => {
  if (!campoCodigo.value.trim()) {
    atualizarResultado({ valido: false, mensagem: "Digite um código para analisar." });
    campoCodigo.focus();
    return;
  }
  atualizarResultado(analisarSintaxe(campoCodigo.value));
});
botaoLimpar.addEventListener("click", () => {
  campoCodigo.value = "";
  sincronizarEditor();
  painelResultado.className = "painel-resultado neutro";
  iconeResultado.textContent = "i";
  resultadoAnalise.textContent = "Pronto para analisar. Use o botão ou pressione Ctrl + Enter.";
  campoCodigo.focus();
});
campoCodigo.addEventListener("input", sincronizarEditor);
campoCodigo.addEventListener("scroll", sincronizarEditor);
campoCodigo.addEventListener("click", atualizarCursor);
campoCodigo.addEventListener("keyup", atualizarCursor);
campoCodigo.addEventListener("keydown", (evento) => {
  if (evento.ctrlKey && evento.key === "Enter") botaoAnalisar.click();
});
sincronizarEditor();
