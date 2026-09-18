const form = document.querySelector("#api-form");
const service = document.querySelector("#service");
const label = document.querySelector("#query-label");
const input = document.querySelector("#query");
const message = document.querySelector("#message");
const result = document.querySelector("#result");

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}

service.addEventListener("change", () => {
    const isCities = service.value === "municipios";
    label.textContent = isCities ? "Sigla da UF" : "Nome da cidade";
    input.value = isCities ? "SC" : "Florianópolis";
    input.maxLength = isCities ? 2 : 80;
    result.hidden = true;
    message.textContent = "";
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Carregando...";
    result.hidden = true;

    try {
        const url = `api.php?service=${encodeURIComponent(service.value)}&query=${encodeURIComponent(input.value.trim())}`;
        const response = await fetch(url);
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
            throw new Error(payload.message || "Erro na consulta.");
        }

        if (service.value === "municipios") {
            const cities = payload.data.cities.map((city) => `<li>${escapeHtml(city)}</li>`).join("");
            result.innerHTML = `
                <h2>${escapeHtml(payload.data.state)} (${escapeHtml(payload.data.uf)})</h2>
                <p>Total de municípios: ${payload.data.count}</p>
                <ul>${cities}</ul>
            `;
        } else {
            result.innerHTML = `
                <h2>${escapeHtml(payload.data.city)}</h2>
                <p>Temperatura: ${escapeHtml(payload.data.temperature)} °C</p>
                <p>Sensação térmica: ${escapeHtml(payload.data.feelsLike)} °C</p>
                <p>Umidade: ${escapeHtml(payload.data.humidity)}%</p>
                <p>Vento: ${escapeHtml(payload.data.wind)} km/h</p>
            `;
        }

        message.textContent = "";
        result.hidden = false;
    } catch (error) {
        message.textContent = error.message;
    }
});
