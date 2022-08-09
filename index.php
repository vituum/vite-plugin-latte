<?php

declare(strict_types=1);

ini_set('log_errors', "0");
ini_set('display_errors', "1");

require __DIR__ . '/vendor/autoload.php';

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

$isDocker = str_starts_with($config->bin, 'docker');

if ($isDocker) {
    define("ROOT_DIR", '/usr/src/app/');
} else {
    define("ROOT_DIR", $config->cwd . '/');
}

define("PACKAGE_DIR", str_replace($config->cwd, ROOT_DIR, $config->packageRoot));

/**
 * @throws JsonException
 */
function NodeHandler($name, ...$params) : string {
    array_unshift($params, $name);

    exec('node '. PACKAGE_DIR .'/handler.js ' . json_encode(json_encode($params, JSON_THROW_ON_ERROR), JSON_THROW_ON_ERROR), $output);

    return $output[0] ?? $params[1];
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
$withoutTemplate = false;

if (!file_exists($file)) {
    throw new Error('File not found ' . $file);
}

if (!str_ends_with($file, '.json.html') && !str_ends_with($file, '.json') && !str_ends_with($file, '.latte.html') && !str_ends_with($file, '.latte')) {
    preg_match('/<script\b[^>]*>([\s\S]+)<\/script>/', file_get_contents($file), $fileContents);

    $fileContents = $fileContents[1];

} else if (str_ends_with($file, '.latte.html')) {
    if (file_exists(str_replace('.latte.html', '.latte.json', $file))) {
        $fileContents = file_get_contents(str_replace('.latte.html', '.latte.json', $file));
    }

    $withoutTemplate = true;
} else if (str_ends_with($file, '.latte')) {
    if (file_exists(str_replace('.latte', '.latte.json', $file))) {
        $fileContents = file_get_contents(str_replace('.latte', '.latte.json', $file));
    }

    $withoutTemplate = true;
} else {
    $fileContents = file_get_contents($file);
}

if (isset($fileContents)) {
    try {
        $params[] = json_decode($fileContents, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new Error('Error parsing params');
    }
}

$params = array_replace_recursive(...$params);

try {
    $params = json_encode($params, JSON_THROW_ON_ERROR);
    $params = json_decode($params, false, 512, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new Error('Error parsing params');
}

foreach (['tel', 'asset'] as $filter) {
    require PACKAGE_DIR . '/latte/' . ucfirst($filter) . 'Filter.php';
    $latte->addFilter($filter, 'App\Latte\\' . ucfirst($filter) . 'Filter::execute');
}

foreach (['fetch', 'placeholder', 'randomColor'] as $function) {
    require PACKAGE_DIR . '/latte/' . ucfirst($function) . 'Function.php';
    $latte->addFunction($function, 'App\Latte\\' . ucfirst($function) . 'Function::execute');
}

foreach ($config->filters  as $filter => $path) {
    if (is_string($path)) {
        require ROOT_DIR . $path;
        $latte->addFilter($filter, 'App\Latte\\' . ucfirst($filter) . 'Filter::execute');
    } elseif (!$isDocker) {
        $latte->addFilter($filter, function (...$params) use ($filter) : string {
            return NodeHandler($filter, ...$params);
        });
    }
}

foreach ($config->functions  as $function => $path) {
    if (is_string($path)) {
        require ROOT_DIR . $path;
        $latte->addFunction($function, 'App\Latte\\' . ucfirst($function) . 'Function::execute');
    }  elseif (!$isDocker) {
        $latte->addFunction($function, function (...$params) use ($function) : string {
            return NodeHandler($function, ...$params);
        });
    }
}

$tag = 'json';
require PACKAGE_DIR . '/latte/' . ucfirst($tag) . 'Tag.php';
eval('$latte->addExtension(new App\Latte\\' . ucfirst($tag) . 'Extension);');

foreach ($config->tags  as $tag => $path) {
    require ROOT_DIR . $path;
    eval('$latte->addExtension(new App\Latte\\' . ucfirst($tag) . 'Extension);');
}

if (!file_exists(str_replace($config->cwd, ROOT_DIR, $params->template))) {
    throw new Error('File not found ' . str_replace($config->cwd, ROOT_DIR, $params->template));
}

if (isset($config->isString) && $config->isString) {
    $latte->setLoader(new Latte\Loaders\StringLoader([
        str_replace($config->cwd, ROOT_DIR, $params->template) => $config->content
    ]));
}

echo $latte->renderToString(str_replace($config->cwd, ROOT_DIR, $params->template), $params);

