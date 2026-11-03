"use strict";
function obterElemento(id) {
    const elemento = document.getElementById(id);
    if (!elemento)
        throw new Error(`Elemento #${id} não encontrado.`);
    return elemento;
}
const campoCodigo = obterElemento("codigo");
const botaoAnalisar = obterElemento("botao-analisar");
const painelResultado = obterElemento("painel-resultado");
const resumoResultado = obterElemento("resumo-resultado");
const listaErros = obterElemento("lista-erros");
const codigoAnalise = obterElemento("codigo-analise");
const pares = { ")": "(", "]": "[", "}": "{" };
function posicaoNoTexto(texto, indice) {
    const antes = texto.slice(0, indice);
    return { linha: antes.split("\n").length, coluna: indice - antes.lastIndexOf("\n") };
}
function formatarPosicao(texto, indice) {
    const posicao = posicaoNoTexto(texto, indice);
    return `linha ${posicao.linha}, coluna ${posicao.coluna}`;
}
// Remove strings e comentários antes de procurar os delimitadores.
function encontrarTodosErros(codigo) {
    const semStringsOuComentarios = codigo.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, trecho => trecho.replace(/[^\n]/g, " "));
    const pilha = [];
    const erros = [];
    for (let indice = 0; indice < semStringsOuComentarios.length; indice += 1) {
        const caractere = semStringsOuComentarios[indice];
        if ("([{".includes(caractere))
            pilha.push({ caractere, indice });
        if (pares[caractere]) {
            const abertura = pilha[pilha.length - 1];
            if (abertura?.caractere === pares[caractere])
                pilha.pop();
            else
                erros.push({ mensagem: `“${caractere}” sem abertura correspondente em ${formatarPosicao(codigo, indice)}.`, indice });
        }
    }
    for (const abertura of pilha) {
        erros.push({ mensagem: `“${abertura.caractere}” sem fechamento correspondente em ${formatarPosicao(codigo, abertura.indice)}.`, indice: abertura.indice });
    }
    return erros.sort((a, b) => a.indice - b.indice);
}
function mostrarResultado() {
    const erros = encontrarTodosErros(campoCodigo.value);
    listaErros.replaceChildren();
    painelResultado.className = `resultado ${erros.length ? "erro" : "sucesso"}`;
    if (erros.length === 0) {
        resumoResultado.textContent = "Nenhum erro de abertura ou fechamento foi encontrado.";
        listaErros.hidden = true;
        return;
    }
    resumoResultado.textContent = `${erros.length} erro(s) encontrado(s):`;
    for (const erro of erros) {
        const item = document.createElement("li");
        item.textContent = erro.mensagem;
        listaErros.append(item);
    }
    listaErros.hidden = false;
}
botaoAnalisar.addEventListener("click", mostrarResultado);
codigoAnalise.textContent = encontrarTodosErros.toString();
