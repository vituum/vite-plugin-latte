<?php

declare(strict_types=1);

ini_set('log_errors', "0");
ini_set('display_errors', "1");

require __DIR__ . '/vendor/autoload.php';

$latte = new Latte\Engine;

if (!file_exists(__DIR__ . '/temp') && !mkdir($concurrentDirectory = __DIR__ . '/temp') && !is_dir($concurrentDirectory)) {
    throw new Error(sprintf('Directory "%s" was not created', $concurrentDirectory));
}

$latte->setTempDirectory(__DIR__ . '/temp');

if (!file_exists(__DIR__ . '/playground/data/main.json')) {
    throw new Error('File not found src/data/main.json');
}

try {
    $params = json_decode(file_get_contents(__DIR__ . '/playground/data/main.json'), false, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new Error($e->getMessage());
}

if (!file_exists(__DIR__ . '/playground/templates/Layout/Main.latte')) {
    throw new Error('File not found template.latte');
}

echo $latte->renderToString(__DIR__ . '/playground/templates/Layout/Main.latte', $params);
