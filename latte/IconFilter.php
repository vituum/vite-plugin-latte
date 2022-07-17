<?php

namespace App\Latte;

class IconFilter
{

    public static function execute($value, $icon = null, $style = null): \Latte\Runtime\Html
    {
        $i = $icon ?? 'icon';

        return new \Latte\Runtime\Html("<svg class='{$i} {$value}' style='{$style}'><use href='#{$value}'/></svg>");
    }
}
