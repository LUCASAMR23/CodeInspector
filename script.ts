type EstadoLeitura = "normal" | "linha" | "bloco" | "aspas-simples" | "aspas-duplas" | "template";

interface Posicao {
  linha: number;
  coluna: number;
}

interface DelimitadorAberto {
  caractere: string;
  indice: number;
}

interface Analise {
  valido: boolean;
  mensagem: string;
}

function obterElemento<T extends HTMLElement>(id: string): T {
  const elemento = document.getElementById(id);
  if (!elemento) throw new Error(`Elemento #${id} não encontrado.`);
  return elemento as T;
}

const campoCodigo = obterElemento<HTMLTextAreaElement>("codigo");
const camadaRealce = obterElemento<HTMLElement>("codigo-realce");
const preRealce = obterElemento<HTMLPreElement>("realce");
const botaoAnalisar = obterElemento<HTMLButtonElement>("botao-analisar");
const botaoLimpar = obterElemento<HTMLButtonElement>("botao-limpar");
const resultadoAnalise = obterElemento<HTMLParagraphElement>("resultado");
const painelResultado = obterElemento<HTMLElement>("painel-resultado");
const iconeResultado = painelResultado.querySelector<HTMLElement>(".resultado-icone") ?? (() => {
  throw new Error("Ícone do resultado não encontrado.");
})();
const posicaoCursor = obterElemento<HTMLSpanElement>("posicao-cursor");

const palavrasReservadas = new Set<string>([
  "async", "await", "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "export", "extends", "finally", "for", "function",
  "if", "import", "in", "instanceof", "let", "new", "of", "return", "static", "super",
  "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield"
]);
const pares: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const aberturas = new Set<string>(Object.values(pares));

function escaparHtml(texto: string): string {
  return texto.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function realcarCodigo(codigo: string): void {
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

function posicaoNoTexto(texto: string, indice: number): Posicao {
  const antes = texto.slice(0, indice);
  return { linha: antes.split("\n").length, coluna: indice - antes.lastIndexOf("\n") };
}

function formatarPosicao(posicao: Posicao): string {
  return `linha ${posicao.linha}, coluna ${posicao.coluna}`;
}

function analisarSintaxe(codigo: string): Analise {
  const pilha: DelimitadorAberto[] = [];
  let estado: EstadoLeitura = "normal";

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

function atualizarResultado(analise: Analise): void {
  painelResultado.className = `painel-resultado ${analise.valido ? "sucesso" : "erro"}`;
  iconeResultado.textContent = analise.valido ? "✓" : "!";
  resultadoAnalise.textContent = analise.mensagem;
}

function atualizarCursor(): void {
  const posicao = posicaoNoTexto(campoCodigo.value, campoCodigo.selectionStart);
  posicaoCursor.textContent = `Linha ${posicao.linha}, coluna ${posicao.coluna}`;
}

function sincronizarEditor(): void {
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
campoCodigo.addEventListener("keydown", (evento: KeyboardEvent) => {
  if (evento.ctrlKey && evento.key === "Enter") botaoAnalisar.click();
});

sincronizarEditor();
