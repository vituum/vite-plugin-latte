<?php

namespace App\Latte;

class PlaceholderFunction {

    public static function execute($width, $height): string {
        $colors = ["333", "444", "666", "222", "777", "888", "111"];
        return 'https://via.placeholder.com/' . $width . 'x' . $height . '/' . $colors[array_rand($colors)];
    }
}
