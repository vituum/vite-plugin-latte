<?php

declare(strict_types=1);

ini_set('log_errors', "0");
ini_set('display_errors', "1");

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/latte/Node.php';

$latte = new Latte\Engine;
$file = $argv[1] ?? null;
$config = $argv[2] ?? null;

if ($config) {
    try {
        $config = json_decode($config, false, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new Error($e->getMessage());
    }
}

$isDocker = str_starts_with($config->php, 'docker');

if ($isDocker) {
    define("ROOT_DIR", '/usr/src/app/');
} else {
    define("ROOT_DIR", $config->cwd . '/');
}

if (!file_exists(__DIR__ . '/temp') && !mkdir($concurrentDirectory = __DIR__ . '/temp') && !is_dir($concurrentDirectory)) {
    throw new Error(sprintf('Directory "%s" was not created', $concurrentDirectory));
}

$latte->setTempDirectory(__DIR__ . '/temp');

$params = [(array)$config->globals];

foreach ($config->data as $dataPath) {
    $dataPath = str_replace($config->cwd, ROOT_DIR, $dataPath);

    if (!file_exists($dataPath)) {
        throw new Error('File not found ' . $dataPath);
    }

    try {
        $params[] = json_decode(file_get_contents($dataPath), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new Error('Error parsing params');
    }
}

$file = str_replace($config->cwd, ROOT_DIR, $file);

if (!file_exists($file)) {
    throw new Error('File not found ' . $file);
}

preg_match('/<script\b[^>]*>([\s\S]+)<\/script>/', file_get_contents($file), $fileContents);

try {
    $params[] = json_decode($fileContents[1], true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new Error('Error parsing params');
}

$params = array_replace_recursive(...$params);

try {
    $params = json_encode($params, JSON_THROW_ON_ERROR);
    $params = json_decode($params, false, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new Error('Error parsing params');
}

foreach (['tel', 'asset'] as $filter) {
    require ROOT_DIR . '/latte/' . ucfirst($filter) . 'Filter.php';
    $latte->addFilter($filter, 'App\Latte\\' . ucfirst($filter) . 'Filter::execute');
}

foreach (['fetch', 'placeholder', 'randomColor'] as $function) {
    require ROOT_DIR . '/latte/' . ucfirst($function) . 'Function.php';
    $latte->addFunction($function, 'App\Latte\\' . ucfirst($function) . 'Function::execute');
}

foreach ($config->filters  as $filter => $path) {
    if (is_string($path)) {
        require ROOT_DIR . $path;
        $latte->addFilter($filter, 'App\Latte\\' . ucfirst($filter) . 'Filter::execute');
    } elseif (!$isDocker) {
        $latte->addFilter($filter, 'App\Latte\\Node::execute');
    }
}

foreach ($config->functions  as $function => $path) {
    if (is_string($path)) {
        require ROOT_DIR . $path;
        $latte->addFunction($function, 'App\Latte\\' . ucfirst($function) . 'Function::execute');
    }  elseif (!$isDocker) {
        $latte->addFunction($function, 'App\Latte\\Node::execute');
    }
}

$tag = 'json';
require ROOT_DIR . '/latte/' . ucfirst($tag) . 'Tag.php';
eval('$latte->addExtension(new App\Latte\\' . ucfirst($tag) . 'Extension);');

foreach ($config->tags  as $tag => $path) {
    require ROOT_DIR . $path;
    eval('$latte->addExtension(new App\Latte\\' . ucfirst($tag) . 'Extension);');
}

if (!file_exists(str_replace($config->cwd, ROOT_DIR, $params->template))) {
    throw new Error('File not found ' . str_replace($config->cwd, ROOT_DIR, $params->template));
}

echo $latte->renderToString(str_replace($config->cwd, ROOT_DIR, $params->template), $params);
