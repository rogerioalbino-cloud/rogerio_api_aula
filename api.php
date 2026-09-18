<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fetchJson(string $url): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_USERAGENT => 'BrasilAgora/1.0',
    ]);

    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($body === false || $error !== '' || $status < 200 || $status >= 300) {
        throw new RuntimeException('O serviço externo não respondeu corretamente.');
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        throw new RuntimeException('O serviço retornou dados inválidos.');
    }

    return $data;
}

$service = trim((string) ($_GET['service'] ?? ''));
$query = trim((string) ($_GET['query'] ?? ''));

try {
    switch ($service) {
        case 'municipios':
            $uf = strtoupper($query);
            if (!preg_match('/^[A-Z]{2}$/', $uf)) {
                respond(['ok' => false, 'message' => 'Informe uma UF com duas letras.'], 422);
            }

            $states = fetchJson('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' . rawurlencode($uf));
            $cities = fetchJson('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' . rawurlencode($uf) . '/municipios?orderBy=nome');

            respond([
                'ok' => true,
                'data' => [
                    'state' => $states['nome'] ?? $uf,
                    'region' => $states['regiao']['nome'] ?? 'Não informada',
                    'uf' => $uf,
                    'count' => count($cities),
                    'cities' => array_map(static fn(array $city): string => (string) $city['nome'], $cities),
                ],
            ]);

        case 'clima':
            if ($query === '' || mb_strlen($query) > 80) {
                respond(['ok' => false, 'message' => 'Informe uma cidade válida.'], 422);
            }

            $geocoding = fetchJson('https://geocoding-api.open-meteo.com/v1/search?name=' . rawurlencode($query) . '&count=1&language=pt&format=json');
            $place = $geocoding['results'][0] ?? null;
            if (!is_array($place)) {
                respond(['ok' => false, 'message' => 'Cidade não encontrada.'], 404);
            }

            $weather = fetchJson(sprintf(
                'https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto',
                rawurlencode((string) $place['latitude']),
                rawurlencode((string) $place['longitude'])
            ));

            respond([
                'ok' => true,
                'data' => [
                    'city' => $place['name'] ?? $query,
                    'state' => $place['admin1'] ?? '',
                    'country' => $place['country'] ?? '',
                    'temperature' => $weather['current']['temperature_2m'] ?? null,
                    'feelsLike' => $weather['current']['apparent_temperature'] ?? null,
                    'humidity' => $weather['current']['relative_humidity_2m'] ?? null,
                    'wind' => $weather['current']['wind_speed_10m'] ?? null,
                    'code' => $weather['current']['weather_code'] ?? null,
                    'updatedAt' => $weather['current']['time'] ?? '',
                ],
            ]);

        default:
            respond(['ok' => false, 'message' => 'Serviço de API inválido.'], 422);
    }
} catch (Throwable $error) {
    respond(['ok' => false, 'message' => $error->getMessage()], 502);
}
