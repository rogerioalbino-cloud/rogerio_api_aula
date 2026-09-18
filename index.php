<?php

$title = 'Teste de APIs';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="assets/js/app.js" defer></script>
</head>
<body>
    <main>
        <h1>Teste de APIs</h1>
        <p>Escolha uma API e faça uma consulta.</p>

        <form id="api-form">
            <label for="service">API</label>
            <select id="service" name="service">
                <option value="municipios">Municípios por UF</option>
                <option value="clima">Clima por cidade</option>
            </select>

            <label for="query" id="query-label">Sigla da UF</label>
            <input id="query" name="query" value="SC" maxlength="2" required>

            <button type="submit">Consultar</button>
        </form>

        <p id="message"></p>
        <section id="result" hidden></section>
    </main>
</body>
</html>
