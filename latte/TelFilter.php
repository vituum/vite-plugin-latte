<?php

namespace App\Latte;

class TelFilter
{
    public static function execute($source): string
    {
        $phone = preg_replace('/\D/', '', $source);

        $addPus = true;
        if (str_starts_with($phone, '00')) {
            $addPus = false;
        }

        if (strlen($phone) === 9) {
            $addPus = false;
        }

        return ($addPus ? '+' : '') . $phone;
    }
}
