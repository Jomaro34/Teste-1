document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".js-formulario");
    const input = document.querySelector("input[name='palavra']");
    const resultado = document.querySelector(".js-resultado");
    const titulo = document.querySelector(".js-resultado__titulo");
    const descricao = document.querySelector(".js-resultado__descricao");
    const carregamento = document.querySelector(".js-carregamento");

    let dicionario = [];

    // Carregar o JSON
    fetch("./dicionario_cinfaes.json")
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log(`Dicionário carregado com sucesso! ${data.length} entradas`);
            dicionario = data;
        })
        .catch(err => {
            console.error("Erro ao carregar o JSON:", err);
            titulo.textContent = "Erro ao carregar o dicionário";
            descricao.textContent = "Verifique se o ficheiro dicionario_cinfaes.json está na raiz e abra via servidor HTTP.";
            resultado.classList.remove("display-none");
        });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const palavra = input.value.trim().toLowerCase();

        if (!palavra) return;

        carregamento.classList.remove("display-none");
        resultado.classList.remove("display-none");

        // Procura a palavra no dicionário (campo palavra existe)
        const entrada = dicionario.find(item =>
            item.palavra && item.palavra.toLowerCase() === palavra
        );

        carregamento.classList.add("display-none");

        if (entrada) {
            titulo.textContent = entrada.palavra;
            descricao.textContent = entrada.descricao || "Sem descrição disponível.";
        } else {
            titulo.textContent = "Não encontrado";
            descricao.textContent = "A palavra não consta no dicionário de Cinfães.";
        }
    });
});

