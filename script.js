document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".js-formulario");
    const input = document.querySelector("input[name='palavra']");
    const resultado = document.querySelector(".js-resultado");
    const titulo = document.querySelector(".js-resultado__titulo");
    const descricao = document.querySelector(".js-resultado__descricao");
    const carregamento = document.querySelector(".js-carregamento");

    let dicionario = [];

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

    function normalize(str) {
        return str ? str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = normalize(input.value);
        if (!query) return;

        carregamento.classList.remove("display-none");
        resultado.classList.remove("display-none");

        const matches = dicionario.filter(item => {
            // procura em qualquer chave do objeto
            for (let key in item) {
                if (typeof item[key] === "string" && normalize(item[key]).includes(query)) {
                    return true;
                }
            }
            return false;
        });

        carregamento.classList.add("display-none");

        if (matches.length > 0) {
            if (matches.length === 1) {
                titulo.textContent = matches[0].Palavra || Object.keys(matches[0])[0];
                descricao.textContent = matches[0].Significado || Object.values(matches[0])[1] || "Sem descrição disponível.";
            } else {
                titulo.textContent = `${matches.length} resultados encontrados:`;
                descricao.innerHTML = matches.map(item => {
                    const palavra = item.Palavra || Object.keys(item)[0];
                    const significado = item.Significado || Object.values(item)[1] || "Sem descrição disponível.";
                    return `<strong>${palavra}</strong>: ${significado}`;
                }).join("<br>");
            }
        } else {
            titulo.textContent = "Não encontrado";
            descricao.textContent = "A palavra não consta no dicionário de Cinfães.";
        }
    });
});


