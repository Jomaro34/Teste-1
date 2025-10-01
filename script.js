document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".js-formulario");
    const input = document.querySelector("input[name='palavra']");
    const resultado = document.querySelector(".js-resultado");
    const titulo = document.querySelector(".js-resultado__titulo");
    const descricao = document.querySelector(".js-resultado__descricao");
    const carregamento = document.querySelector(".js-carregamento");

    let dicionario = [];

    // Carregar JSON
    fetch("./dicionario_cinfaes.json")
        .then(res => res.json())
        .then(data => {
            console.log(`Dicionário carregado! ${data.length} entradas`);
            dicionario = data;
        })
        .catch(err => {
            console.error("Erro ao carregar JSON:", err);
            titulo.textContent = "Erro ao carregar o dicionário";
            descricao.textContent = "Verifique se o ficheiro dicionario_cinfaes.json está na raiz e abra via servidor HTTP.";
            resultado.classList.remove("display-none");
        });

    // Normaliza string: minúsculas, sem acentos, sem espaços extras
    function normalize(str) {
        if (!str) return "";
        return str
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove acentos
            .replace(/\s+/g, " "); // remove múltiplos espaços
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = normalize(input.value);

        if (!query) return;

        carregamento.classList.remove("display-none");
        resultado.classList.remove("display-none");

        // Busca parcial no JSON real
        const matches = dicionario.filter(item => 
            item.Palavra && normalize(item.Palavra).includes(query)
        );

        carregamento.classList.add("display-none");

        if (matches.length > 0) {
            if (matches.length === 1) {
                titulo.textContent = matches[0].Palavra;
                descricao.textContent = matches[0].Significado || "Sem descrição disponível.";
            } else {
                titulo.textContent = `${matches.length} resultados encontrados:`;
                descricao.innerHTML = matches
                    .map(item => `<strong>${item.Palavra}</strong>: ${item.Significado || "Sem descrição disponível."}`)
                    .join("<br>");
            }
        } else {
            titulo.textContent = "Não encontrado";
            descricao.textContent = "A palavra não consta no dicionário de Cinfães.";
        }
    });
});


