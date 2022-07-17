<?php

namespace App\Latte;

class FetchFunction {
    public static function execute($file): string {
        $hashPath = __DIR__ . '../temp' . md5($file);

        if (!str_starts_with($file, 'http')) {
            if (!file_exists(ROOT_DIR . $file)) {
                trigger_error(ROOT_DIR . $file . ' cannot be fetched');
                return '';
            }

            $content = file_get_contents(ROOT_DIR . $file);
        } elseif (file_exists($hashPath)) {
            $content = file_get_contents($hashPath);
        } else {
            $content = @file_get_contents($file);

            if ($content) {
                file_put_contents($hashPath, $content);
            }
        }

        return $content;
    }
}
