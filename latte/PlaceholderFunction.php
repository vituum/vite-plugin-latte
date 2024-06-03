<?php

namespace App\Latte;

class PlaceholderFunction {

    public static function execute($width, $height): string {
        $colors = ["333333", "444444", "666666", "222222", "777777", "888888", "111111"];
        return 'https://placehold.co/' . $width . 'x' . $height . '/' . $colors[array_rand($colors)] . '/' . 'webp';
    }
}
