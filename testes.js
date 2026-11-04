// Execute node testes.js. A página não depende deste arquivo nem do Node.js.
const verificar = require("node:assert/strict");
const arquivos = require("node:fs");
const caminho = require("node:path");
const ambiente = require("node:vm");

function criarNo(texto = "") {
  return {
    textContent: texto,
    filhos: [],
    ouvintes: {},
    append(...filhos) { this.filhos.push(...filhos); },
    replaceChildren(...filhos) { this.filhos = filhos; },
    addEventListener(evento, funcao) { this.ouvintes[evento] = funcao; }
  };
}

function lerTexto(no) {
  return no.filhos.length ? no.filhos.map(lerTexto).join("") : no.textContent;
}

const elementos = {};
for (const id of ["codigo", "botao-analisar", "painel-resultado", "resumo-resultado",
  "lista-erros", "painel-destaque", "codigo-destacado", "codigo-analise"]) {
  elementos[id] = criarNo();
}

const contexto = {
  document: {
    getElementById: id => elementos[id],
    createDocumentFragment: () => criarNo(),
    createTextNode: texto => criarNo(texto),
    createElement: nome => {
      verificar.ok(["li", "span"].includes(nome));
      return criarNo();
    }
  }
};

ambiente.runInNewContext(
  arquivos.readFileSync(caminho.join(__dirname, "script.js"), "utf8"), contexto
);

const analisar = contexto.analisarCodigo;

// Delimitadores dentro de strings, comentários e strings escapadas são ignorados.
for (const codigo of [
  "({[]})",
  'const texto = "([{";',
  "const texto = '})]';",
  'const texto = `([\n}];`;',
  String.raw`const texto = "aspa: \" ([{";`,
  String.raw`const texto = 'aspa: \' )]}';`,
  String.raw`const texto = "barra: \\"; []`,
  '// } " return\n[]',
  '/* [ " const\n} */ ()',
  "// }\r[]",
  "// }\r\n[]",
  "// }\u2028[]",
  '"antes\\\r\ndepois"',
  "(".repeat(10000) + ")".repeat(10000)
]) {
  verificar.equal(analisar(codigo).erros.length, 0, codigo);
}

// Metadados de posição e lista completa, ordenada pela localização no texto.
verificar.match(analisar("\r\n  ]").erros[0].mensagem, /linha 2, coluna 3/);
verificar.match(analisar("\n  [").erros[0].mensagem, /linha 2, coluna 3/);
verificar.match(analisar("/* (\n ] */\n  }").erros[0].mensagem, /linha 3, coluna 3/);
verificar.match(analisar("const lista = [").erros[0].mensagem, /coluna 15/);
verificar.deepEqual(Array.from(analisar(")\n]\n}").erros, erro => erro.indice), [0, 2, 4]);
verificar.deepEqual(Array.from(analisar("( ] { ( ]").erros, erro => erro.indice), [2, 4, 8]);

// Regressão da imagem: uma troca de ] por ) não deve virar quatro avisos.
const exemploImagem = [
  "function verificarNumeros() {",
  "    const numeros = [1, 2, 3);",
  "",
  "    if (numeros[0] === 1) {",
  "        console.log(numeros);",
  "    }",
  "}"
].join("\n");
verificar.equal(analisar(exemploImagem).erros.length, 1);
verificar.match(analisar(exemploImagem).erros[0].mensagem, /linha 2, coluna 29/);
verificar.ok(analisar(exemploImagem).erros[0].mensagem.includes("Esperado “]”"));

// Clique e destaque: nomes inteiros, texto preservado e nenhum HTML interpretado.
const codigoDestaque = 'const texto = "if <img src=x onerror=alert(1)>"; // return\nlet ifTotal = true;';
elementos.codigo.value = codigoDestaque;
elementos["botao-analisar"].ouvintes.click();
verificar.equal(elementos["painel-resultado"].className, "resultado sucesso");
verificar.equal(elementos["painel-destaque"].hidden, false);
verificar.equal(lerTexto(elementos["codigo-destacado"]), codigoDestaque);

const fragmento = elementos["codigo-destacado"].filhos[0];
verificar.deepEqual(
  fragmento.filhos.filter(no => no.className === "palavra-reservada").map(no => no.textContent),
  ["const", "let", "true"]
);

elementos.codigo.value = exemploImagem;
elementos["botao-analisar"].ouvintes.click();
verificar.equal(elementos["lista-erros"].filhos.length, 1);
verificar.equal(elementos["resumo-resultado"].textContent, "1 erro encontrado:");

elementos.codigo.ouvintes.input();
verificar.equal(elementos["resumo-resultado"].textContent, "Aguardando análise");
verificar.equal(elementos["lista-erros"].filhos.length, 0);
verificar.equal(elementos["painel-destaque"].hidden, true);

for (const vazio of ["", " \n\t "]) {
  elementos.codigo.value = vazio;
  elementos["botao-analisar"].ouvintes.click();
  verificar.equal(elementos["resumo-resultado"].textContent, "Digite um código para analisar");
  verificar.equal(elementos["painel-resultado"].className, "resultado neutro");
}

console.log("Todos os testes passaram: pilha, posições, vários erros, destaque e ações da página.");
