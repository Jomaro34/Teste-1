document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".js-formulario");
    const input = document.querySelector("input[name='palavra']");
    const resultado = document.querySelector(".js-resultado");
    const titulo = document.querySelector(".js-resultado__titulo");
    const descricao = document.querySelector(".js-resultado__descricao");
    const carregamento = document.querySelector(".js-carregamento");

    let dicionario = [];

    // Carregar o ficheiro JSON
    fetch("./dicionario_cinfaes.json")
        .then(res => res.json())
        .then(data => {
            dicionario = data;
        })
        .catch(err => {
            console.error("Erro ao carregar o dicionário:", err);
        });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const palavra = input.value.trim().toLowerCase();

        if (!palavra) return;

        carregamento.classList.remove("display-none");
        resultado.classList.remove("display-none");

        // Procurar no dicionário
        const entrada = dicionario.find(item => item.palavra.toLowerCase() === palavra);

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
