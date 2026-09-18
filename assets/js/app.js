const services = {
    municipios: {
        label: "IBGE Localidades",
        title: "Encontre municípios",
        description: "Informe uma sigla estadual para consultar suas cidades.",
        fieldLabel: "Sigla da UF",
        placeholder: "Ex.: SC",
        defaultValue: "SC",
        docs: "https://servicodados.ibge.gov.br/api/docs/localidades",
    },
    clima: {
        label: "Open-Meteo",
        title: "Clima em tempo real",
        description: "Pesquise uma cidade para visualizar as condições atuais.",
        fieldLabel: "Nome da cidade",
        placeholder: "Ex.: Florianópolis",
        defaultValue: "Florianópolis",
        docs: "https://open-meteo.com/en/docs",
    },
};

const tabs = document.querySelectorAll(".tab");
const form = document.querySelector("#query-form");
const input = document.querySelector("#query");
const label = document.querySelector("#query-label");
const serviceLabel = document.querySelector("#service-label");
const title = document.querySelector("#service-title");
const description = document.querySelector("#service-description");
const docs = document.querySelector("#docs-link");
const emptyState = document.querySelector("#empty-state");
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const submitButton = form.querySelector("button");
let selectedService = "municipios";

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}

function selectService(key) {
    selectedService = key;
    const service = services[key];
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.service === key));
    serviceLabel.textContent = service.label;
    title.textContent = service.title;
    description.textContent = service.description;
    label.textContent = service.fieldLabel;
    input.placeholder = service.placeholder;
    input.value = service.defaultValue;
    input.maxLength = key === "municipios" ? 2 : 80;
    docs.href = service.docs;
    status.hidden = true;
    result.hidden = true;
    emptyState.hidden = false;
    input.focus();
}

function weatherDescription(code) {
    if (code === 0) return "Céu limpo";
    if ([1, 2, 3].includes(code)) return "Parcialmente nublado";
    if ([45, 48].includes(code)) return "Neblina";
    if (code >= 51 && code <= 67) return "Chuva";
    if (code >= 80 && code <= 82) return "Pancadas de chuva";
    if (code >= 95) return "Trovoadas";
    return "Condição variável";
}

function renderMunicipalities(data) {
    const cities = data.cities.map((city, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(city)}</li>`).join("");
    return `
        <div class="result-heading">
            <div><p>${escapeHtml(data.region)} · ${escapeHtml(data.uf)}</p><h2>${escapeHtml(data.state)}</h2></div>
            <strong>${data.count}<small>municípios</small></strong>
        </div>
        <ul class="city-list">${cities}</ul>
    `;
}

function renderWeather(data) {
    return `
        <div class="weather-location"><p>${escapeHtml(data.state)} · ${escapeHtml(data.country)}</p><h2>${escapeHtml(data.city)}</h2></div>
        <div class="temperature">${escapeHtml(data.temperature)}<sup>°C</sup></div>
        <p class="condition">${weatherDescription(Number(data.code))}</p>
        <div class="metrics">
            <article><span>Sensação</span><strong>${escapeHtml(data.feelsLike)} °C</strong></article>
            <article><span>Umidade</span><strong>${escapeHtml(data.humidity)}%</strong></article>
            <article><span>Vento</span><strong>${escapeHtml(data.wind)} km/h</strong></article>
        </div>
    `;
}

tabs.forEach((tab) => tab.addEventListener("click", () => selectService(tab.dataset.service)));

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    emptyState.hidden = true;
    result.hidden = true;
    status.hidden = false;
    status.className = "status loading";
    status.textContent = "Buscando dados...";
    submitButton.disabled = true;

    try {
        const response = await fetch(`api.php?service=${encodeURIComponent(selectedService)}&query=${encodeURIComponent(query)}`);
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.message || "Não foi possível concluir a consulta.");

        result.innerHTML = selectedService === "municipios" ? renderMunicipalities(payload.data) : renderWeather(payload.data);
        status.hidden = true;
        result.hidden = false;
    } catch (error) {
        status.className = "status error";
        status.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});
