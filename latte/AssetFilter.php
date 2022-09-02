<?php

namespace App\Latte;

class AssetFilter
{
    public static function execute($source): string
    {
        return str_starts_with($source, 'http') ? $source : str_replace("/src/", "/", $source);
    }
}
