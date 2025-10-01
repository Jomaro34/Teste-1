document.addEventListener("DOMContentLoaded", () => {
    console.log("Documento carregado");
    const form = document.querySelector(".js-formulario");
    const input = document.querySelector("input[name='palavra']");
    const resultado = document.querySelector(".js-resultado");
    const titulo = document.querySelector(".js-resultado__titulo");
    const descricao = document.querySelector(".js-resultado__descricao");
    const carregamento = document.querySelector(".js-carregamento");

    let dicionario = [];

    fetch("./dicionario_cinfaes.json")
        .then(res => {
            console.log("Resposta do fetch:", res);
            return res.json();
        })
        .then(data => {
            console.log("Dados carregados do JSON:", data);
            dicionario = data;
        })
        .catch(err => {
            console.error("Erro ao carregar ou parsear JSON:", err);
        });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const palavra = input.value.trim().toLowerCase();
        console.log("Palavra digitada:", palavra);

        if (!palavra) return;

        carregamento.classList.remove("display-none");
        resultado.classList.remove("display-none");

        const entrada = dicionario.find(item => item.palavra.toLowerCase() === palavra);
        console.log("Entrada encontrada:", entrada);

        carregamento.classList.add("display-none");

        if (entrada) {
            titulo.textContent = entrada.palavra;
            descricao.textContent = entrada.descricao;
        } else {
            titulo.textContent = "Não encontrado";
            descricao.textContent = "A palavra não consta no dicionário de Cinfães.";
        }
    });
});
